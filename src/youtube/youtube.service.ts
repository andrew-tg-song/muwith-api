import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class YoutubeService {
  private headlessBrowserPage: Page;
  private headlessBrowserPageLock = false;

  private async launchBrowser() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    this.headlessBrowserPage = await browser.newPage();
    console.info('YoutubeService browser launched.');
  }

  private async asynchronousConstructor() {
    await this.launchBrowser();
  }

  constructor() {
    this.asynchronousConstructor();
  }

  // TODO: Task queue and browser pool
  async getFirstVideoUrlBySearch(keyword: string) {
    while (this.headlessBrowserPageLock) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.headlessBrowserPageLock = true;
    await this.headlessBrowserPage.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`);
    await this.headlessBrowserPage.waitForSelector('#video-title');
    const url = await this.headlessBrowserPage.evaluate(() => {
      const linkElement = document.querySelector('#video-title.ytd-video-renderer') as HTMLLinkElement;
      return linkElement?.href?.split('&')[0];
    });
    this.headlessBrowserPageLock = false;
    return url;
  }
}
