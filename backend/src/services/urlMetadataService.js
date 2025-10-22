import axios from 'axios';
import * as cheerio from 'cheerio';

class UrlMetadataService {
  /**
   * Extract job metadata from a URL
   * @param {string} url - The job posting URL
   * @returns {Promise<{company: string, position: string}>}
   */
  static async extractJobMetadata(url) {
    try {
      // Validate URL
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Fetch the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000, // 10 seconds timeout
      });

      const html = response.data;
      const $ = cheerio.load(html);

      let company = '';
      let position = '';

      // LinkedIn
      if (hostname.includes('linkedin.com')) {
        company = this.extractLinkedInCompany($);
        position = this.extractLinkedInPosition($);
      }
      // Seek
      else if (hostname.includes('seek.com')) {
        company = this.extractSeekCompany($);
        position = this.extractSeekPosition($);
      }
      // Indeed
      else if (hostname.includes('indeed.com')) {
        company = this.extractIndeedCompany($);
        position = this.extractIndeedPosition($);
      }
      // Glassdoor
      else if (hostname.includes('glassdoor.com')) {
        company = this.extractGlassdoorCompany($);
        position = this.extractGlassdoorPosition($);
      }
      // Generic fallback using OpenGraph and meta tags
      else {
        const metadata = this.extractGenericMetadata($);
        company = metadata.company;
        position = metadata.position;
      }

      // Clean up extracted data
      company = company.trim();
      position = position.trim();

      return {
        company: company || 'Unknown Company',
        position: position || 'Unknown Position',
      };
    } catch (error) {
      console.error('Error extracting metadata from URL:', error.message);
      throw new Error('Failed to extract job information from URL');
    }
  }

  /**
   * Extract company name from LinkedIn
   */
  static extractLinkedInCompany($) {
    // Try multiple selectors
    let company = '';

    // Method 1: Company name in topcard
    company = $('.topcard__org-name-link').first().text();
    if (company) return company;

    // Method 2: Company name in job details
    company = $('.job-details-jobs-unified-top-card__company-name').first().text();
    if (company) return company;

    // Method 3: Meta tag
    company = $('meta[property="og:site_name"]').attr('content');
    if (company && company !== 'LinkedIn') return company;

    // Method 4: Try another selector
    company = $('[data-tracking-control-name="public_jobs_topcard-org-name"]').first().text();

    return company;
  }

  /**
   * Extract position from LinkedIn
   */
  static extractLinkedInPosition($) {
    let position = '';

    // Method 1: Job title in topcard
    position = $('.topcard__title').first().text();
    if (position) return position;

    // Method 2: Job title in unified card
    position = $('.job-details-jobs-unified-top-card__job-title').first().text();
    if (position) return position;

    // Method 3: H1 tag
    position = $('h1').first().text();
    if (position) return position;

    // Method 4: Meta tag
    position = $('meta[property="og:title"]').attr('content');

    return position;
  }

  /**
   * Extract company name from Seek
   */
  static extractSeekCompany($) {
    let company = '';

    // Try multiple selectors
    company = $('[data-automation="advertiser-name"]').first().text();
    if (company) return company;

    company = $('span[data-automation="advertiser-name"]').first().text();
    if (company) return company;

    company = $('[class*="advertiser"]').first().text();

    return company;
  }

  /**
   * Extract position from Seek
   */
  static extractSeekPosition($) {
    let position = '';

    // Try multiple selectors
    position = $('[data-automation="job-detail-title"]').first().text();
    if (position) return position;

    position = $('h1[data-automation="job-detail-title"]').first().text();
    if (position) return position;

    position = $('h1').first().text();

    return position;
  }

  /**
   * Extract company name from Indeed
   */
  static extractIndeedCompany($) {
    let company = '';

    // Try multiple selectors
    company = $('[data-company-name="true"]').first().text();
    if (company) return company;

    company = $('.jobsearch-InlineCompanyRating-companyHeader').first().text();
    if (company) return company;

    company = $('[class*="companyName"]').first().text();

    return company;
  }

  /**
   * Extract position from Indeed
   */
  static extractIndeedPosition($) {
    let position = '';

    // Try multiple selectors
    position = $('[class*="jobsearch-JobInfoHeader-title"]').first().text();
    if (position) return position;

    position = $('h1[class*="jobTitle"]').first().text();
    if (position) return position;

    position = $('h1').first().text();

    return position;
  }

  /**
   * Extract company name from Glassdoor
   */
  static extractGlassdoorCompany($) {
    let company = '';

    company = $('[data-test="employerName"]').first().text();
    if (company) return company;

    company = $('.employerName').first().text();

    return company;
  }

  /**
   * Extract position from Glassdoor
   */
  static extractGlassdoorPosition($) {
    let position = '';

    position = $('[data-test="job-title"]').first().text();
    if (position) return position;

    position = $('.jobTitle').first().text();
    if (position) return position;

    position = $('h1').first().text();

    return position;
  }

  /**
   * Generic metadata extraction using OpenGraph and meta tags
   */
  static extractGenericMetadata($) {
    let company = '';
    let position = '';

    // Try to get job title from various meta tags
    position = $('meta[property="og:title"]').attr('content') || '';
    if (!position) {
      position = $('meta[name="title"]').attr('content') || '';
    }
    if (!position) {
      position = $('title').text() || '';
    }
    if (!position) {
      position = $('h1').first().text() || '';
    }

    // Try to get company name from various meta tags
    company = $('meta[property="og:site_name"]').attr('content') || '';
    if (!company) {
      company = $('meta[name="author"]').attr('content') || '';
    }

    // Try to parse company from job title (e.g., "Software Engineer - Google")
    if (!company && position) {
      const parts = position.split(/[-–|@]/);
      if (parts.length > 1) {
        company = parts[parts.length - 1].trim();
        position = parts[0].trim();
      }
    }

    return { company, position };
  }
}

export default UrlMetadataService;
