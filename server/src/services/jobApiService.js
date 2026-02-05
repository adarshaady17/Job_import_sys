const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

class JobApiService {
  async fetchJobsFromApi(url) {
    const res = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'JobImportSystem/1.0' },
    });

    const body = res.data;
    if (typeof body === 'string') {
      if (body.trim().startsWith('<')) {
        const json = await parser.parseStringPromise(body);
        return this.extractJobsFromXML(json);
      }
      try {
        const json = JSON.parse(body);
        return this.extractJobsFromJSON(json);
      } catch {
        throw new Error('Response is not valid XML or JSON');
      }
    }

    // Already JSON
    return this.extractJobsFromJSON(body);
  }

  extractJobsFromXML(xml) {
    const jobs = [];
    if (xml.rss && xml.rss.channel && xml.rss.channel[0].item) {
      for (const item of xml.rss.channel[0].item) {
        const job = this.normalizeRssItem(item);
        if (job) jobs.push(job);
      }
    }
    return jobs;
  }

  extractJobsFromJSON(json) {
    if (Array.isArray(json)) {
      return json.map((j) => this.normalizeGeneric(j));
    }
    if (Array.isArray(json.jobs)) {
      return json.jobs.map((j) => this.normalizeGeneric(j));
    }
    return [];
  }

  normalizeRssItem(item) {
    const title = this.text(item.title);
    const description = this.text(item.description) || this.text(item.content);
    const link = this.text(item.link);
    const guid = this.text(item.guid) || link;
    const pubDate = this.text(item.pubDate);

    return {
      externalId: guid || link || Buffer.from(title).toString('base64'),
      title: title || 'Untitled Job',
      description: description || '',
      url: link || '',
      publishedDate: pubDate ? new Date(pubDate) : new Date(),
      category: this.text(item.category) || '',
      company: '',
      location: '',
      jobType: '',
      salary: '',
      rawData: item,
    };
  }

  normalizeGeneric(j) {
    return {
      externalId: j.id || j.externalId || j.guid || Buffer.from(j.title || '').toString('base64'),
      title: j.title || j.jobTitle || 'Untitled Job',
      description: j.description || j.summary || '',
      url: j.url || j.link || '',
      publishedDate: j.publishedDate || j.pubDate || j.createdAt || new Date(),
      category: j.category || '',
      company: j.company || j.companyName || '',
      location: j.location || '',
      jobType: j.jobType || '',
      salary: j.salary || '',
      rawData: j,
    };
  }

  text(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return this.text(val[0]);
    if (typeof val === 'object' && val._) return val._;
    return '';
  }
}

module.exports = new JobApiService();


