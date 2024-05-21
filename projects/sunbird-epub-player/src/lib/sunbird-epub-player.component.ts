import {
  EventEmitter,
  Component,
  Output,
  Input,
  OnInit,
  HostListener,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Renderer2,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { ViwerService } from "./services/viewerService/viwer-service";
import { PlayerConfig } from "./sunbird-epub-player.interface";
import { EpubPlayerService } from "./sunbird-epub-player.service";
import { epubPlayerConstants, telemetryType } from "./sunbird-epub.constant";
import {
  ErrorService,
  errorCode,
  errorMessage,
} from "@project-sunbird/sunbird-player-sdk-v9";
import { UtilService } from "./services/utilService/util.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  // tslint:disable-next-line:component-selector
  selector: "sunbird-epub-player",
  templateUrl: "./sunbird-epub-player.component.html",
  styleUrls: ["./sunbird-epub-player.component.scss"],
})
export class EpubPlayerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  fromConst = epubPlayerConstants;
  @ViewChild("epubPlayer", { static: true }) epubPlayerRef: ElementRef;
  @Input() playerConfig: PlayerConfig;
  @Input() showFullScreen = false;
  @Output() headerActionsEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() telemetryEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() playerEvent: EventEmitter<object>;
  private unlistenMouseEnter: () => void;
  private unlistenMouseLeave: () => void;
  public showControls = true;
  public validPage = true;
  url: string = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute';
  audio: any = '';
  audioQueue: any[] = [];
  isPlaying: boolean = false;
  counter: number = 0;
  loading: boolean = false;
  showContentError: boolean;
  sideMenuConfig = {
    showShare: false,
    showDownload: false,
    showReplay: false,
    showExit: false,
    showPrint: false,
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
    zoom: false,
  };
  languageList =[
    {languageCode:'en',modelId:'6576a17e00d64169e2f8f43d'},
    {languageCode:'hi',modelId:'6576a1e500d64169e2f8f43e'},
    {languageCode:'as',modelId:'6576a15e00d64169e2f8f43c'},
    {languageCode:'bn',modelId:'6348db11fb796d5e100d4ffb'},
    {languageCode:'gu',modelId:'6348db16fd966563f61bc2c1'},
    {languageCode:'kn',modelId:'6576a2344e7d42484da63534'},
    {languageCode:'mr',modelId:'633c02befd966563f61bc2be'},
    {languageCode:'or',modelId:'6348db26fd966563f61bc2c2'},
    {languageCode:'pa',modelId:'6576a27800d64169e2f8f440'},
    {languageCode:'ta',modelId:'6348db32fd966563f61bc2c3'},
    {languageCode:'te',modelId:'6348db37fb796d5e100d4ffe'},
    {languageCode:'ur',modelId:'6576a2b000d64169e2f8f442'}
  ]

  constructor(
    public viwerService: ViwerService,
    private epubPlayerService: EpubPlayerService,
    public errorService: ErrorService,
    public utilService: UtilService,
    private renderer2: Renderer2,
    public http: HttpClient
  ) {
    this.playerEvent = this.viwerService.playerEvent;
  }

  @HostListener("document:TelemetryEvent", ["$event"])
  onTelemetryEvent(event) {
    this.telemetryEvent.emit(event.detail);
  }

  async ngOnInit() {
    this.isInitialized = true;
    if (this.playerConfig) {
      if (typeof this.playerConfig === "string") {
        try {
          this.playerConfig = JSON.parse(this.playerConfig);
        } catch (error) {
          console.error("Invalid playerConfig: ", error);
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
      this.viwerService.raiseExceptionLog(
        errorCode.internetConnectivity,
        this.currentPageIndex,
        errorMessage.internetConnectivity,
        this.traceId,
        new Error(errorMessage.internetConnectivity)
      );
    }

    // checks content compatibility error
    const contentCompabilityLevel =
      this.playerConfig?.metadata?.compatibilityLevel;
    if (contentCompabilityLevel) {
      const checkContentCompatible =
        this.errorService.checkContentCompatibility(contentCompabilityLevel);
      if (!checkContentCompatible?.isCompitable) {
        // tslint:disable-next-line:max-line-length
        this.viwerService.raiseExceptionLog(
          errorCode.contentCompatibility,
          this.currentPageIndex,
          errorCode.contentCompatibility,
          this.traceId,
          checkContentCompatible.error
        );
      }
    }

    this.showEpubViewer = true;
    this.sideMenuConfig = {
      ...this.sideMenuConfig,
      ...this.playerConfig.config.sideMenu,
    };
    this.getEpubLoadingProgress();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.audio.pause();
    this.audio.currentTime = 0;
    console.log('ngonchange called......')
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
    this.unlistenMouseEnter = this.renderer2.listen(
      epubPlayerElement,
      "mouseenter",
      () => {
        this.showControls = true;
      }
    );

    this.unlistenMouseLeave = this.renderer2.listen(
      epubPlayerElement,
      "mouseleave",
      () => {
        this.showControls = false;
      }
    );
  }

  headerActions(eventdata) {
    this.headerActionsEvent.emit(eventdata);
  }
 
  handleButtonstop(event: any) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  getModelId(languageCode:string) {
    const language = this.languageList.find(lang => lang.languageCode === languageCode);
    console.log(language.modelId)
    return language ? language.modelId : null;
  }


  async detectLanguage(chunk: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const payload ={
        input: [
          { source: chunk }
        ],
        modelId: "631736990154d6459973318e",
        task: "txt-lang-detection",
        userId: "49eb8255277b40ddb7d706a100b36268"
      };
  
      this.http.post(this.url, payload).subscribe(
        (res: any) => {
          const langCode = res.output[0].langPrediction[0].langCode;
          const modelId = this.getModelId(langCode);
          resolve(modelId);
        },
        error => {
          console.error('Error detecting language:', error);
          resolve(null); // Resolve with null if there's an error
        }
      );
    });
  }
  
  async handleButtonClick(gender: any) {
    let epubjsId = document.querySelector('[id^="epubjs-view-"]').id;
    if (epubjsId) {
      let epubHTML = document.getElementById(epubjsId).getAttribute("srcdoc");
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(epubHTML, "text/html");
      var hTags = htmlDoc.querySelectorAll("a,span,h1,h2,h3,h4,h5,h6,p,ol,ul,li");
  
      if (hTags.length > 0) {
        let speechText = "";
        hTags.forEach(tag => {
          speechText += tag.textContent + " ";
        });
        const chunks = this.chunkText(speechText, 500);
  
        for (let i = 0; i < chunks.length; i++) {
          console.log(chunks[i], 'this is chunks');
          const modelId = await this.detectLanguage(chunks[i]);
          await this.processChunk(chunks[i], gender, modelId);
        }
      }
    } else {
      console.log("No epubjsId found");
    }
  }
  
  async processChunk(chunk: string, gender: any, modelId: string | null) {
    if (!modelId) {
      console.error('Model ID not found.');
      return;
    }
  
    const payload = {
      modelId: modelId,
      task: 'tts',
      input: [{ source: chunk }],
      gender: gender,
      userId: '49eb8255277b40ddb7d706a100b36268',
    };
  
    try {
      const response: any = await this.http.post(this.url, payload).toPromise();
      console.log(response);
  
      const audioContent = response.audio[0].audioContent;
      const base64Audio = audioContent;
      const audioUrl = 'data:audio/mp3;base64,' + base64Audio;
      console.log(audioUrl,'this is audio Url')
      this.audioQueue.push(audioUrl);
  
      if (!this.isPlaying) {
        this.playNextAudio();
      }
    } catch (error) {
      this.loading = false;
      console.error('Error processing audio:', error);
    }
  }
  playNextAudio() {
    if (this.audioQueue.length > 0) {
      this.loading = false;
      const audioUrl = this.audioQueue[this.counter++]; //this.audioQueue.shift();
  
      this.audio = new Audio(audioUrl);
      this.audio.controls = true;
      // Append the audio element to the DOM
    //  this.receivedId.appendChild(audio);

      // Set flag to indicate audio is playing
      this.isPlaying = true;

      // Play the audio
      this.audio.play();
  
      // Set flag to indicate audio is playing
      this.isPlaying = true;
  
      // Listen for audio end event to play the next audio
      this.audio.addEventListener('ended', () => {
        // Reset flag when audio ends
        this.isPlaying = false;
  
        // Play the next audio in the queue
        this.playNextAudio();
      });
    } else {
      // No more audio in the queue, reset flag
      this.isPlaying = false;
    }
  }

   // Function to split text into chunks
   chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    if (!text) return chunks; // Return empty array if text is falsy
  
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
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

    if (
      this.playerConfig.config?.pagesVisited?.length &&
      this.playerConfig.config?.currentLocation
    ) {
      this.currentPageIndex =
        this.playerConfig.config.pagesVisited[
          this.playerConfig.config.pagesVisited.length - 1
        ];
    }
    this.viwerService.metaData.pagesVisited.push(this.currentPageIndex);
  }

  onPageChange(event) {
    if (event?.data?.index) {
      this.currentPageIndex = event.data.index;
    }
    this.currentPageIndex = this.utilService.getCurrentIndex(
      event,
      this.currentPageIndex
    );
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
    window.speechSynthesis.cancel();
  }

  onEpubLoadFailed(error) {
    this.showContentError = true;
    this.viewState = this.fromConst.LOADING;
    // tslint:disable-next-line:max-line-length
    this.viwerService.raiseExceptionLog(
      error.errorCode,
      this.currentPageIndex,
      error.errorMessage,
      this.traceId,
      new Error(error.errorMessage)
    );
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
    if (event.type === "DOWNLOAD") {
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
    const a = document.createElement("a");
    a.href = this.viwerService.artifactUrl;
    a.download = this.viwerService.contentName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.viwerService.raiseHeartBeatEvent("DOWNLOAD");
  }

  @HostListener("window:beforeunload")
  ngOnDestroy() {
    this.audio.pause();
    this.audio.currentTime = 0;
    const EndEvent = {
      type: this.fromConst.END,
      data: {
        index: this.currentPageIndex,
      },
    };
    this.viwerService.raiseEndEvent(EndEvent);
    this.viwerService.isEndEventRaised = false;
    this.unlistenMouseEnter();
    this.unlistenMouseLeave();
  }
}
