import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class YoutubeService {
  private readonly PAGE_POOL_COUNT = 1;
  private readonly headlessBrowserPages: {
    page: Page;
    lock: boolean;
    taskQueue: string[];
  }[] = [];
  // Round-robin scheduling
  private lastSchedulingPageIndex = this.PAGE_POOL_COUNT - 1;

  private async launchBrowser() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    await Promise.all(
      Array.from(new Array(this.PAGE_POOL_COUNT)).map(async () => {
        this.headlessBrowserPages.push({
          page: await browser.newPage(),
          lock: false,
          taskQueue: [],
        });
      }),
    );
    console.info('YoutubeService browser launched.');
  }

  private async asynchronousConstructor() {
    await this.launchBrowser();
  }

  constructor() {
    this.asynchronousConstructor();
  }

  async getFirstVideoUrlBySearch(keyword: string) {
    const schedulingPageIndex =
      this.lastSchedulingPageIndex === this.PAGE_POOL_COUNT - 1 ? 0 : this.lastSchedulingPageIndex + 1;
    this.lastSchedulingPageIndex = schedulingPageIndex;
    const headlessBrowserPage = this.headlessBrowserPages[schedulingPageIndex];
    const taskId = uuidv4();
    headlessBrowserPage.taskQueue.push(taskId);
    while (headlessBrowserPage.lock || headlessBrowserPage.taskQueue[0] !== taskId) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    headlessBrowserPage.lock = true;
    headlessBrowserPage.taskQueue.shift();
    await headlessBrowserPage.page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`);
    await headlessBrowserPage.page.waitForSelector('#video-title');
    const url = await headlessBrowserPage.page.evaluate(() => {
      const linkElement = document.querySelector('#video-title.ytd-video-renderer') as HTMLLinkElement;
      return linkElement?.href?.split('&')[0];
    });
    headlessBrowserPage.lock = false;
    return url;
  }
}
