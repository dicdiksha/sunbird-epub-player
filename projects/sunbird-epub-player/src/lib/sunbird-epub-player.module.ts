import { NgModule,CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA } from '@angular/core';
import { EpubPlayerComponent } from './sunbird-epub-player.component';
import { EpubViewerComponent } from './epub-viewer/epub-viewer.component';
import { SunbirdPlayerSdkModule  } from '@dicdikshaorg/player-sdk-v9';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';




@NgModule({
  declarations: [EpubPlayerComponent, EpubViewerComponent],
  imports: [
    CommonModule,
    SunbirdPlayerSdkModule,
    HttpClientModule
  ],
  exports: [EpubPlayerComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class SunbirdEpubPlayerModule { }
