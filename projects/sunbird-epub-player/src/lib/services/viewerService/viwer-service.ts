import { Injectable, EventEmitter } from '@angular/core';
import { PlayerConfig } from '../../sunbird-epub-player.interface';
import { EpubPlayerService } from '../../sunbird-epub-player.service';
import { UtilService } from '../utilService/util.service';
import { eventName, telemetryType } from '../../sunbird-epub.constant';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ViwerService {

  public currentIndex = 0;
  public totalNumberOfPages = 0;
  public epubPlayerStartTime: number;
  public epubLastPageTime: number;
  public endPageSeen = false;
  public timeSpent = '0:0';
  private version = '1.0';
  public playerEvent = new EventEmitter<any>();
  public contentName: string;
  public loadingProgress: number;
  public showDownloadPopup: boolean;
  public src: string;
  public userName: string;
  public metaData: any;
  public identifier: any;
  public artifactUrl: any;
  public isAvailableLocally = false;
  public isEndEventRaised = false;
  constructor(
    private utilService: UtilService,
    private epubPlayerService: EpubPlayerService,
    private http: HttpClient
  ) { }

  initialize({ context, config, metadata }: PlayerConfig) {
    this.epubPlayerStartTime = this.epubLastPageTime = new Date().getTime();
    this.totalNumberOfPages = 0;
    this.currentIndex = 0;
    this.contentName = metadata.name;
    this.identifier = metadata.identifier;
    this.artifactUrl = metadata.artifactUrl;
    this.isAvailableLocally = metadata.isAvailableLocally;
    if (this.isAvailableLocally) {
      const basePath = (metadata.streamingUrl) ? (metadata.streamingUrl) : (metadata.basePath || metadata.baseDir);
      this.src = `${basePath}/${metadata.artifactUrl}`;
    } else {
      this.src = metadata.streamingUrl || metadata.artifactUrl;
    }
    if (context.userData) {
      const { userData: { firstName, lastName } } = context;
      this.userName = firstName === lastName ? firstName : `${firstName} ${lastName}`;
    }
    this.metaData = {
      pagesVisited: [],
      totalPages: 0,
      duration: [],
      zoom: [],
      rotation: []
    };
    this.showDownloadPopup = false;
    this.endPageSeen = false;
  }

  raiseStartEvent(event) {
    this.currentIndex = event.items[0].index;
    const duration = new Date().getTime() - this.epubPlayerStartTime;
    const startEvent = {
      eid: 'START',
      ver: this.version,
      edata: {
        type: 'START',
        currentPage: this.currentIndex,
        duration
      },
      metaData: this.metaData
    };
    this.playerEvent.emit(startEvent);
    this.epubLastPageTime = this.epubPlayerStartTime = new Date().getTime();
    this.epubPlayerService.start(duration);
  }

  raiseHeartBeatEvent(event, teleType?) {
    if (event.data) {
      this.currentIndex = event.data.index;
    }
    const eventType = event.type ? event.type : event;
    const heartBeatEvent = {
      eid: 'HEARTBEAT',
      ver: this.version,
      edata: {
        type: eventType,
        currentPage: this.currentIndex
      },
      metaData: this.metaData
    };
    this.playerEvent.emit(heartBeatEvent);
    if (telemetryType.IMPRESSION === teleType) {
      this.epubPlayerService.impression(this.currentIndex);
    }
    if (telemetryType.INTERACT === teleType) {
      this.epubPlayerService.interact(eventType.toLowerCase(), this.currentIndex);
    }
  }

  raiseEndEvent(event) {
    if (!this.isEndEventRaised) {
      this.currentIndex = event.data.index;
      const percentage = event.data.percentage || 0;
      if (event.data.percentage) {
        this.endPageSeen = true;
      }
      const duration = new Date().getTime() - this.epubPlayerStartTime;
      this.metaData.duration = duration;
      this.metaData.totalPages = this.totalNumberOfPages;
      const endEvent = {
        eid: 'END',
        ver: this.version,
        edata: {
          type: 'END',
          currentPage: event.data.index,
          totalPages: this.totalNumberOfPages,
          duration
        },
        metaData: this.metaData
      };
      this.playerEvent.emit(endEvent);
      const visitedlength = this.currentIndex;
      this.timeSpent = this.utilService.getTimeSpentText(this.epubPlayerStartTime);
      this.epubPlayerService.end(duration, percentage, this.currentIndex, this.endPageSeen);
    }
  }


  raiseExceptionLog(errorCode: string , pageIndex, errorType: string , traceId , stacktrace: Error ) {
    const exceptionLogEvent = {
      eid: 'ERROR',
      edata: {
          err: errorCode,
          errtype: errorType,
          requestid: traceId || '',
          stacktrace
      }
    };
    this.playerEvent.emit(exceptionLogEvent);
    this.epubPlayerService.error(errorCode , errorType, pageIndex , stacktrace);
  }

  isValidEpubSrc(src): Promise<Blob> {
    return new Promise(async (resolve , reject) => {
      this.http.get(src, { responseType: 'blob' }).toPromise().then((res) => {
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }


  raiseHeartBeatEventNew(type: string, telemetryType1: string, pageId: number | string, nextContentId?: string) {
    const hearBeatEvent: any = {
      eid: 'HEARTBEAT',
      ver: this.version,
      edata: {
        type,
        currentPage: this.currentIndex
      },
      metaData: this.metaData
    };

    if (type === eventName.nextContentPlay && nextContentId) {
      hearBeatEvent.edata.nextContentId = nextContentId;
    }

    // if (this.isSectionsAvailable) {
    //   hearBeatEvent.edata.sectionId = this.questionSetId;
    // }

    this.playerEvent.emit(hearBeatEvent);
    if (telemetryType.INTERACT === telemetryType1) {
      this.epubPlayerService.interact(type.toLowerCase(), pageId);
    } else if (telemetryType.IMPRESSION === telemetryType1) {
      this.epubPlayerService.impression(pageId);
    }

  }
}
