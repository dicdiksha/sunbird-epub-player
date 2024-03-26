import { AfterViewInit, ViewChild, Component, ElementRef, Input,
  EventEmitter, Output, OnInit, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import Epub from 'epubjs';
import { ViwerService } from '../services/viewerService/viwer-service';
import { epubPlayerConstants as fromConst } from '../sunbird-epub.constant';
import { errorCode, errorMessage } from '@project-sunbird/sunbird-player-sdk-v9';
import { UtilService } from '../services/utilService/util.service';

const MAX_TIME_TO_LOAD_SPINE = 5 * 60 * 1000; // 5 minutes
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'epub-viewer',
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.css']
})
export class EpubViewerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  eBook: any;
  rendition: any;
  lastSection: any;
  scrolled: boolean;
  @ViewChild('epubViewer', { static: true }) epubViewer: ElementRef;
  @Input() epubSrc: string;
  @Input() config: any;
  @Input() identifier: string;
  @Input() actions = new EventEmitter<any>();
  @Input() showFullScreen = false;
  @Output() viewerEvent = new EventEmitter<any>();
  idForRendition: any;
  epubBlob: object;
  
  constructor(
    public viwerService: ViwerService,
    private utilService: UtilService
  ) { }
  ngOnInit() {
    this.idForRendition = `${this.identifier}-content`;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.rendition && !changes?.showFullScreen?.firstChange) {
      this.rendition.resize();
    }
  }

  async ngAfterViewInit() {
    
    try {
      if (!this.viwerService.isAvailableLocally) {
        this.epubBlob = await this.viwerService.isValidEpubSrc(this.epubSrc);
        this.eBook = Epub(this.epubBlob);
      } else if (this.viwerService.isAvailableLocally) {
        this.eBook = Epub(this.epubSrc);
      }
      this.rendition = this.eBook.renderTo(this.idForRendition, {
        flow: 'paginated',
        width: '100%',
      });
      this.rendition.on('layout', (layout) => {
        this.viwerService.totalNumberOfPages = this.eBook?.navigation?.length;
        if (this.eBook.navigation.length > 2) {
          this.rendition.spread('none');
          this.rendition.flow('scrolled');
          this.scrolled = true;
        } else {
          this.rendition.spread('auto');
          this.scrolled = false;
        }
      });

      this.rendition.on('displayError', (error) => {
        this.emitErrorEvent();
      });

      const spine = await this.utilService.fulfillWithTimeLimit(MAX_TIME_TO_LOAD_SPINE, this.eBook.loaded.spine, null);

      if (spine) {
        this.displayEpub();
        this.lastSection = spine.last();
        this.viewerEvent.emit({
          type: fromConst.EPUBLOADED,
          data: spine
        });
        this.handleActions(spine);
      } else {
        this.emitErrorEvent();
      }
    } catch (error) {
      this.emitErrorEvent();
    }
  }

  displayEpub() {
    const { currentLocation } = this.config;
    if (!currentLocation) {
      this.rendition.display();
      console.log(this.rendition.display(),'This is alert 3')
    }
    this.eBook.ready.then(() => {
      return this.eBook.locations.generate(1000);
    }).then((locations) => {
      const totalPages = this.eBook?.spine?.length;
      this.viwerService.totalNumberOfPages = totalPages ? (totalPages - 1) : 0;
      if (currentLocation) {
        const cfi = this.eBook.locations.cfiFromPercentage(Number(currentLocation));
        this.rendition.display(cfi);
      }
    });
  }

  handleActions(spine) {
    this.actions.subscribe((event) => {
      const type = event.type;
      if (this.rendition?.location?.start) {
        const data = this.rendition.location.start;
        if (this.scrolled && data.href === this.lastSection.href) {
          this.viwerService.metaData.currentLocation = 0;
          this.emitEndEvent();
        } else {
          if (this.rendition.location.atEnd || (spine.length === 1 &&
            (this.rendition.location.end.displayed.page + 1 >= this.rendition.location.end.displayed.total))) {
            this.viwerService.metaData.currentLocation = 0;
            this.emitEndEvent();
          }
        }
        if (type === fromConst.NEXT) {
          this.rendition.next().then(() => {
            this.saveCurrentLocation();
            this.viewerEvent.emit({
              type: fromConst.PAGECHANGE,
              data,
              interaction: fromConst.NEXT
            });
          });
        } else if (type === fromConst.PREVIOUS) {
          this.rendition.prev().then(() => {
            this.saveCurrentLocation();
            this.viewerEvent.emit({
              type: fromConst.PAGECHANGE,
              data,
              interaction: fromConst.PREVIOUS
            });
          });
        }
        if (type === fromConst.NAVIGATE_TO_PAGE) {
          this.rendition.display(event.data);
          this.viewerEvent.emit({
            type: fromConst.NAVIGATE_TO_PAGE,
            event,
            interaction: fromConst.NAVIGATE_TO_PAGE
          });
        }

        if (type === fromConst.INVALID_PAGE_ERROR) {
          this.viewerEvent.emit({
            type: fromConst.INVALID_PAGE_ERROR,
            event,
            interaction: fromConst.INVALID_PAGE_ERROR
          });
        }
      }
    });
  }

  saveCurrentLocation() {
    const currentLocation = this.rendition.currentLocation();
    if (currentLocation?.start?.cfi) {
      // Get the Percentage (or location) from that CFI
      const currentPageLocation = this.eBook.locations.percentageFromCfi(currentLocation.start.cfi);
      this.viwerService.metaData.currentLocation = currentPageLocation;
    }
  }

  emitEndEvent() {
    this.viewerEvent.emit({
      type: fromConst.END,
      data: {
        percentage: 100
      }
    });
  }

  emitErrorEvent() {
    this.viewerEvent.emit({
      type: fromConst.ERROR,
      errorCode: errorCode.contentLoadFails,
      errorMessage: errorMessage.contentLoadFails
    });
  }

  ngOnDestroy() {
    this.eBook?.destroy();
  }
}
