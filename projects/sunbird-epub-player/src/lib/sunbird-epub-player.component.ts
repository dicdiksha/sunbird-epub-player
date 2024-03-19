import { EventEmitter, Component, Output, Input, OnInit, HostListener,
  OnDestroy, ElementRef, ViewChild, AfterViewInit, Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { ViwerService } from './services/viewerService/viwer-service';
import { PlayerConfig } from './sunbird-epub-player.interface';
import { EpubPlayerService } from './sunbird-epub-player.service';
import { epubPlayerConstants, telemetryType } from './sunbird-epub.constant';
import { ErrorService, errorCode, errorMessage } from '@project-sunbird/sunbird-player-sdk-v9';
import { UtilService } from './services/utilService/util.service';



@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sunbird-epub-player',
  templateUrl: './sunbird-epub-player.component.html',
  styleUrls: ['./sunbird-epub-player.component.scss']
})
export class EpubPlayerComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  fromConst = epubPlayerConstants;
  @ViewChild('epubPlayer', { static: true }) epubPlayerRef: ElementRef;
  @Input() playerConfig: PlayerConfig;
  @Input() showFullScreen = false;
  @Output() headerActionsEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() telemetryEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() playerEvent: EventEmitter<object>;
  private unlistenMouseEnter: () => void;
  private unlistenMouseLeave: () => void;
  public showControls = true;
  public validPage = true;
  showContentError: boolean;
  sideMenuConfig = {
    showShare: false,
    showDownload: false,
    showReplay: false,
    showExit: false,
    showPrint: false
  };
  public isInitialized = false;
  viewState = this.fromConst.LOADING;
  intervalRef: any;
  progress = 0;
  showEpubViewer: boolean;
  receivedData: any;
  public traceId: string;
  currentPageIndex = 1;
  headerConfiguration = {
    rotation: false,
    goto: true,
    navigation: true,
    zoom: false
  };
  

  constructor(
    public viwerService: ViwerService,
    private epubPlayerService: EpubPlayerService,
    public errorService: ErrorService,
    public utilService: UtilService,
    private renderer2: Renderer2
  ) {
    this.playerEvent = this.viwerService.playerEvent;
  }

  @HostListener('document:TelemetryEvent', ['$event'])
  onTelemetryEvent(event) {
    this.telemetryEvent.emit(event.detail);
  }

  async ngOnInit() {
    this.isInitialized = true;
    if (this.playerConfig) {
    if (typeof this.playerConfig === 'string') {
      try {
        this.playerConfig = JSON.parse(this.playerConfig);
      } catch (error) {
        console.error('Invalid playerConfig: ', error);
      }
    }
  }

  
    // initializing services
    this.viwerService.initialize(this.playerConfig);
    this.epubPlayerService.initialize(this.playerConfig);
    this.traceId = this.playerConfig?.config?.traceId;


    // checks online error while loading epub
    if (!navigator.onLine && !this.viwerService.isAvailableLocally) {
      // tslint:disable-next-line:max-line-length
      this.viwerService.raiseExceptionLog(errorCode.internetConnectivity, this.currentPageIndex, errorMessage.internetConnectivity, this.traceId, new Error(errorMessage.internetConnectivity));
    }

    // checks content compatibility error
    const contentCompabilityLevel = this.playerConfig?.metadata?.compatibilityLevel;
    if (contentCompabilityLevel) {
      const checkContentCompatible = this.errorService.checkContentCompatibility(contentCompabilityLevel);
      if (!checkContentCompatible?.isCompitable) {
        // tslint:disable-next-line:max-line-length
        this.viwerService.raiseExceptionLog(errorCode.contentCompatibility, this.currentPageIndex, errorCode.contentCompatibility, this.traceId, checkContentCompatible.error);
      }
    }

    this.showEpubViewer = true;
    this.sideMenuConfig = { ...this.sideMenuConfig, ...this.playerConfig.config.sideMenu };
    this.getEpubLoadingProgress();

  }

  ngOnChanges(changes: SimpleChanges) {
    window.speechSynthesis.cancel();
    if (changes.showFullScreen && !changes?.showFullScreen?.firstChange) {
      this.showFullScreen = changes.showFullScreen.currentValue;
    }
    if (changes.playerConfig.firstChange && this.isInitialized) {
      // Calling for web component explicitly and life cycle works in different order
      this.ngOnInit();
    }
  }
  ngAfterViewInit() {
    const epubPlayerElement = this.epubPlayerRef.nativeElement;
    this.unlistenMouseEnter = this.renderer2.listen(epubPlayerElement, 'mouseenter', () => {
      this.showControls = true;
    });

    this.unlistenMouseLeave = this.renderer2.listen(epubPlayerElement, 'mouseleave', () => {
      this.showControls = false;
    });
  }

  headerActions(eventdata) {
    this.headerActionsEvent.emit(eventdata);
  }
  handleButtonstop(event:any){
     window.speechSynthesis.cancel();
  }

  handleButtonClick(event: any) {
    let epubjsId = document.querySelector('[id^="epubjs-view-"]').id;
    if (epubjsId) {
        let epubHTML = document.getElementById(epubjsId).getAttribute('srcdoc');
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(epubHTML, 'text/html');
        var hTags = htmlDoc.querySelectorAll('a,span,h1,h2,h3,h4,h5,h6,p');

        // Check if there are any matching elements
        if (hTags.length > 0) {
            let speechText = '';
            hTags.forEach(function (tag) {
                speechText += tag.textContent + ' ';
                console.log(speechText,'this is speechtext')
            });
            let synth = window.speechSynthesis;
            let speech = new SpeechSynthesisUtterance(speechText);
            synth.speak(speech);
        } 
        else {
            console.log('No matching elements found');
        }
    } 
    else {
        console.log('No epubjsId found');
    }
}


  

  viewerEvent(event) {
    if (event.type === this.fromConst.EPUBLOADED) {
      this.onEpubLoaded(event);
    }
    if (event.type === this.fromConst.PAGECHANGE) {
      this.onPageChange(event);
    }
    if (event.type === this.fromConst.END) {
      this.onEpubEnded(event);
    }
    if (event.type === this.fromConst.ERROR) {
      this.onEpubLoadFailed(event);
    }
    if (event.type === this.fromConst.NAVIGATE_TO_PAGE) {
      this.onJumpToPage(event);
    }
    if (event.type === this.fromConst.INVALID_PAGE_ERROR) {
      this.validPage = event.data;
      this.resetValidPage();
    }
  }

  resetValidPage() {
    setTimeout(() => {
      this.validPage = true;
    }, 5000);
  }

  onEpubLoaded(event) {
    clearInterval(this.intervalRef);
    this.viewState = this.fromConst.START;
    this.viwerService.raiseStartEvent(event.data);

    if (this.playerConfig.config?.pagesVisited?.length && this.playerConfig.config?.currentLocation) {
      this.currentPageIndex = this.playerConfig.config.pagesVisited[this.playerConfig.config.pagesVisited.length - 1];
    }
    this.viwerService.metaData.pagesVisited.push(this.currentPageIndex);
  }

  onPageChange(event) {
    if (event?.data?.index) {
      this.currentPageIndex = event.data.index;
    }
    this.currentPageIndex = this.utilService.getCurrentIndex(event, this.currentPageIndex);
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.INTERACT);
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.IMPRESSION);
    this.viwerService.metaData.pagesVisited.push(this.currentPageIndex);
  }

  onJumpToPage(type) {
    this.currentPageIndex = type?.event?.data;
    this.viwerService.raiseHeartBeatEvent(type, telemetryType.INTERACT);
    this.viwerService.raiseHeartBeatEvent(type, telemetryType.IMPRESSION);
    this.viwerService.metaData.pagesVisited.push(this.currentPageIndex);
  }

  onEpubEnded(event) {
    this.viewState = this.fromConst.END;
    this.showEpubViewer = false;
    event.data.index = this.currentPageIndex;
    this.viwerService.raiseEndEvent(event);
    window.speechSynthesis.cancel()
  }

  onEpubLoadFailed(error) {
    this.showContentError = true;
    this.viewState = this.fromConst.LOADING;
    // tslint:disable-next-line:max-line-length
    this.viwerService.raiseExceptionLog(error.errorCode, this.currentPageIndex, error.errorMessage, this.traceId, new Error(error.errorMessage));
  }

  replayContent(event) {
    this.currentPageIndex = 1;
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.INTERACT);
    this.viewState = this.fromConst.START;
    this.viwerService.metaData.pagesVisited.push(this.currentPageIndex);
    this.ngOnInit();
  }

  exitContent(event) {
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.INTERACT);
  }

  sideBarEvents(event) {
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.INTERACT);
    if (event.type === 'DOWNLOAD') {
      this.downloadEpub();
    }
  }

  sidebarMenuEvent(event) {
    this.viwerService.raiseHeartBeatEvent(event, telemetryType.INTERACT);
  }

  getEpubLoadingProgress() {
    this.intervalRef = setInterval(() => {
      if (this.progress < 95) {
        this.progress = this.progress + 5;
      }
    }, 10);
  }

  downloadEpub() {
    const a = document.createElement('a');
    a.href = this.viwerService.artifactUrl;
    a.download = this.viwerService.contentName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.viwerService.raiseHeartBeatEvent('DOWNLOAD');
  }

  @HostListener('window:beforeunload')
  ngOnDestroy() {
    window.speechSynthesis.cancel()
    const EndEvent = {
      type: this.fromConst.END,
      data: {
        index: this.currentPageIndex
      }
    };
    this.viwerService.raiseEndEvent(EndEvent);
    this.viwerService.isEndEventRaised = false;
    this.unlistenMouseEnter();
    this.unlistenMouseLeave();
  }
}
