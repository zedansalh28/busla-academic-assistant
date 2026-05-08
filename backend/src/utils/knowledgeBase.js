const fs = require('fs');
const path = require('path');

class KnowledgeBase {
  constructor() {
    try {
      const kbPath = path.join(__dirname, '../../data/knowledge_base.json');
      const rawData = fs.readFileSync(kbPath, 'utf-8');
      this.data = JSON.parse(rawData).content || [];
    } catch (error) {
      console.warn('Knowledge base file not found or invalid, using empty database');
      this.data = [];
    }
  }

  search(query, profile = null) {
    if (!this.data || this.data.length === 0 || !query) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(w => w.length > 2);

    let results = this.data.filter(item => {
      if (!item) return false;
      const titleMatch = item.title?.toLowerCase().includes(queryLower);
      const descMatch = item.description?.toLowerCase().includes(queryLower);
      const tagsMatch = item.tags?.some(tag => keywords.some(kw => tag.includes(kw)));
      return titleMatch || descMatch || tagsMatch;
    });

    results.sort((a, b) => this.calculateScore(b, query, profile) - this.calculateScore(a, query, profile));
    return results;
  }

  calculateScore(item, query, profile) {
    if (!item) return 0;
    let score = 0;

    if (item.title?.toLowerCase().includes(query.toLowerCase())) score += 3;
    if (item.description?.toLowerCase().includes(query.toLowerCase())) score += 2;
    if (item.tags?.some(tag => tag.includes(query.toLowerCase()))) score += 1;

    if (profile) {
      if (item.major === profile.major) score += 2;
      if (item.year === profile.year) score += 2;
      if (item.difficulty === profile.difficulty_level) score += 1;
    }

    return score;
  }

  getByCategory(category) {
    return this.data.filter(item => item?.category === category) || [];
  }

  getByDifficulty(difficulty) {
    return this.data.filter(item => item?.difficulty === difficulty) || [];
  }

  getForMajor(major, year = null) {
    const results = this.data.filter(item => item?.major === major) || [];
    return year ? results.filter(item => item.year === year) : results;
  }
}

module.exports = new KnowledgeBase();
