# The Epub player library for Sunbird platform!
 The Epub player library is powered by Angular. This player is primarily designed to be used on Sunbird consumption platforms _(mobile app, web portal, offline desktop app)_ to drive reusability and maintainability, hence reducing the redundant development effort significantly, and it can be integrated with any platform irrespective of the platforms and the frontend frameworks. It is exported not only as an angular library but also as a web component. 

# Getting started with different integrations steps
 The epub player can be integrated as a web component and also as an angular library in angular application projects and it can also be integrated into any mobile framework as a web component.              

# Use as web components	

Any web based application can use this library as a web component. It accepts couple of inputs and triggers player and telemetry events back to the application.

- Insert [library](https://github.com/Sunbird-Knowlg/sunbird-epub-player/blob/release-5.5.0/web-component/sunbird-epub-player.js) as below:
	```javascript
	<script type="text/javascript" src="sunbird-epub-player.js"></script>
	```
  
- Get sample playerConfig from here: [playerConfig](https://github.com/Sunbird-Knowlg/sunbird-epub-player/blob/main/src/app/data.ts)

- Create a custom html element: `sunbird-epub-player`
	```javascript
    const  epubElement = document.createElement('sunbird-epub-player');
   ```

- Pass data using `player-config`
	```javascript
	epubElement.setAttribute('player-config', JSON.stringify(playerConfig));
	```

	**Note:** Attribute name should be in kebab-case regardless of the actual Attribute name used in the Angular app. The value of the attribute should be in **string** type, as web-component does not accept any objects or arrays.

- Listen for the output events: **playerEvent** and **telemetryEvent**

	```javascript
	epubElement.addEventListener('playerEvent', (event) => {
		console.log("On playerEvent", event);
	});
	epubElement.addEventListener('telemetryEvent', (event) => {
		console.log("On telemetryEvent", event);
	});
	```
- Append this element to existing element
	```javascript
	const  myPlayer = document.getElementById("my-player");
	myPlayer.appendChild(epubPlayerElement);
	```
- Refer demo [example](https://github.com/Sunbird-Knowlg/sunbird-epub-player/blob/release-5.5.0/web-component-demo/index.html)

- To run the project, we can directly open index.html file in browser or can use local server to run the project.

- ![demo]((https://github.com/Sunbird-Knowlg/sunbird-epub-player/blob/release-5.5.0/web-component-demo/epub-player-wc.png)

# Use as Web component  in the Angular app

- Run command 
  ```bash
    npm i @project-sunbird/sunbird-epub-player-web-component
  ```

- Add these entries in angular json file inside assets, scripts and styles like below

  ```bash
            "assets": [
              "src/favicon.ico",
              "src/assets",
              {
                "glob": "**/*.*",
                "input": "./node_modules/@project-sunbird/sunbird-epub-player-web-component/assets",
                "output": "/assets/"
              }
            ],
            "styles": [
              "src/styles.scss",
              "node_modules/@project-sunbird/sunbird-epub-player-web-component/styles.css"
            ],
            "scripts": [
              "node_modules/@project-sunbird/sunbird-epub-player-web-component/sunbird-epub-player.js"
            ]

  ```

- Import  CUSTOM_ELEMENTS_SCHEMA in app module and add it to the NgModule as part of schemas like below

	```javascript
  ...
  import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
  ...

  @NgModule({
    ...
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    ...
  })

	```

- Integrating sunbird-epub-player web component in angular component
    
  Create a viewChild in html template of the angular component like

  ```bash

      <div #epub></div>

  ```

  Refer the viewChild in ts file of the component and create the epub player using document.createElement, then attach the player config and listen to the player and telemetry events like below and since we are rendering using viewChild these steps should be under ngAfterViewInit hook of the angular component.

```bash

....

@ViewChild('epub') epub: ElementRef;

  ....
 ngAfterViewInit() {
    const playerConfig = <Config need be added>;
      const epubElement = document.createElement('sunbird-epub-player');
      epubElement.setAttribute('player-config', JSON.stringify(playerConfig));

      epubElement.addEventListener('playerEvent', (event) => {
        console.log("On playerEvent", event);
      });

      epubElement.addEventListener('telemetryEvent', (event) => {
        console.log("On telemetryEvent", event);
      });
      this.epub.nativeElement.append(epubElement);
  }
  ....

```

**Note:** : Click to see the mock - [playerConfig](https://github.com/Sunbird-Knowlg/sunbird-epub-player/blob/main/src/app/data.ts) and send input config as string 


# Use as Angular library in angular app

## Step 1: Installation

Just run the following:
```red
ng add @project-sunbird/sunbird-epub-player-v9
```

It will install sunbird-epub-player for the default application specified in your `angular.json`. If you have multiple projects and you want to target a specific application, you could specify the `--project` option

```red
ng add @project-sunbird/sunbird-epub-player-v9 --project myProject
```
### Manual installation
If you prefer not to use schematics or want to add `sunbird-epub-player-v9` to an older project, you'll need to do the following:

<details>
  <summary>Click here to show detailed instructions!</summary>
  
  #### 1. Install the packages:

  ```bash
npm install @project-sunbird/sunbird-epub-player-v9 --save
npm install @project-sunbird/sb-styles --save
npm install @project-sunbird/client-services --save
npm install epubjs --save
  ```

  #### 2. Include the sb-styles and assets in angular.json configuration:
    
  Add following under architect.build.assets and styles
  
  ```diff
  {
    ...
    "build": {
    "builder": "@angular-devkit/build-angular:browser",
    "options": {
      ...
      "assets": [
      ...
  +   {
  +    "glob": "**/*.*",
  +    "input": "./node_modules/@project-sunbird/sunbird-epub-player-v9/lib/assets/",
  +    "output": "/assets/"
  +   }	
      ...    
      ],
      "styles": [
      ...
  +   "./node_modules/@project-sunbird/sb-styles/assets/_styles.scss"    
      ...
      ],
      "scripts": [
      ...
  +   "node_modules/epubjs/dist/epub.js"    
      ...
      ],
      ...
    }
  ```
  

  #### 3. Import the modules and components:

  Import the NgModule where you want to use:

  ```diff
+  import { SunbirdEpubPlayerModule } from '@project-sunbird/sunbird-epub-player-v9';
  @NgModule({
    ...
+    imports: [SunbirdEpubPlayerModule],
    ...
  })
  export class YourAppModule { }
  
  ```

</details>

    
## Step 2: Add css in global styles
```css
body {
    background-color: white;
    height: 100%;
}
html {
    height: 100%;
}
```

## Step 3: Send input to render Epub player
Use the mock config in your component to send input to Epub player
Click to see the mock - [playerConfig](src/app/data.ts)

## Player config
```js
var playerConfig = {
  "context": {
    "mode": "play",  // To identify preview used by the user to play/edit/preview
    "authToken": "", // Auth key to make  api calls
    "sid": "7283cf2e-d215-9944-b0c5-269489c6fa56", // User sessionid on portal or mobile 
    "did": "3c0a3724311fe944dec5df559cc4e006", // Unique id to identify the device or browser 
    "uid": "anonymous", // Current logged in user id
    "channel": "505c7c48ac6dc1edc9b08f21db5a571d", // Unique id of the channel(Channel ID)
    "pdata": {
      "id": "sunbird.portal", // Producer ID. For ex: For sunbird it would be "portal" or "genie"
      "ver": "3.2.12", // Version of the App
      "pid": "sunbird-portal.contentplayer" // Optional. In case the component is distributed, then which instance of that component
    },
    "contextRollup": { // Defines the content roll up data
      "l1": "505c7c48ac6dc1edc9b08f21db5a571d"
    },
    "tags": [ // Defines the tags data
      ""
    ],
    "cdata": [], // Defines correlation data
    "timeDiff": 0,  // Defines the time difference
    "objectRollup": {}, // Defines the object roll up data
    "host": "", // Defines the from which domain content should be load
    "endpoint": "", // Defines the end point
    "userData": {  // Defines the user data firstname & lastname
      "firstName": "",
      "lastName": ""
    }
  },
  "config": { 
	"traceId": "123456", // Defines trace id
    "sideMenu": { 
      "showShare": true,    // show/hide share button in side menu. default value is true
      "showDownload": true, // show/hide download button in side menu. default value is true
      "showReplay": false, // show/hide replay button in side menu. default value is false
      "showExit": true,   // show/hide exit button in side menu. default value is true
    }
  },
  "metadata": {}, // Content metadata json object (from API response take -> response.result.content)
} 

```
## Telemetry property description
|Property Name| Description| Default Value
|--|----------------------|--|
| `context` | It is an `object` it contains the `uid`,`did`,`sid`,`mode` etc., these will be logged inside the telemetry  | ```{}``` |
| `mode` | It is  `string` to identify preview used by the user to play/edit/preview | ```play```|
| `authToken` | It is  `string` and Auth key to make  api calls | ```''```|
| `sid` | It is  `string` and User sessionid on portal or mobile | ```''```|
| `did` | It is  `string` and Unique id to identify the device or browser| ```''```|
| `uid` | It is  `string` and Current logged in user id| ```''```|
| `channel` | It is `string` which defines channel identifier to know which channel is currently using.| `in.sunbird` |
| `pdata` | It is an `object` which defines the producer information it should have identifier and version and canvas will log in the telemetry| ```{'id':'in.sunbird', 'ver':'1.0'}```|
| `contextRollup` | It is an `object` which defines content roll up data | ```{}```|
| `tags` | It is an `array` which defines the tag data | ```[]```|
| `objectRollup` | It is an `object` which defines object rollup data | ```{}```|
| `host` | It is  `string` which defines the from which domain content should be load|```window.location.origin```  |
| `userData` | It is an `object` which defines user data | ```{}```|
| `cdata` | It is an `array` which defines the correlation data | ```[]```|

## Config property description
|Property Name| Description| Default Value
|--|----------------------|--|
| `config` | It is an `object` it contains the `sideMenu`, these will be used to configure the canvas  | ```{ traceId: "12345", sideMenu: {"showShare": true, "showDownload": true, "showReplay": false, "showExit": true}}``` |
| `config.traceId` | It is  `string` which defines the trace id | ```''```|
| `config.sideMenu.showShare` | It is  `boolean` to show/hide share button in side menu| ```true```|
| `config.sideMenu.showDownload` | It is  `boolean` to show/hide download button in side menu| ```true```|
| `config.sideMenu.showReplay` | It is  `boolean` to show/hide replay button in side menu| ```false```|
| `config.sideMenu.showExit` | It is  `boolean` to show/hide exit button in side menu| ```true```|
| `metadata` | It is an `object` which defines content metadata json object (from API response take -> response.result.content) | ```{}```|

## Available components
|Feature| Notes| Selector|Code|Input|Output
|--|--|--|------------------------------------------------------------------------------------------|---|--|
| Epub Player | Can be used to render epub | sunbird-epub-player| *`<sunbird-epub-player [playerConfig]="playerConfig"><sunbird-epub-player>`*|playerConfig|playerEvent, telemetryEvent|

<br /><br />

# Use as Web component in Mobile app 
For existing apps, follow these steps [steps](README.md#use-as-web-component--in-the-angular-app) to begin using.

# Use as Angular library in Mobile app
For existing apps, follow these steps to begin using.

## Step 1: Install the packages

Click to see the steps - [InstallPackages](README.md#step-1-install-the-packages)

## Step 2: Include the sb-styles and assets in angular.json

Click to see the steps - [IncludeStyles](README.md#step-2-include-the-styles-scripts-and-assets-in-angularjson) , but use 
`src/global.scss` instead of  `src/styles.css` in styles.

## Step 3: Import the modules and components

Click to see the steps - [Import](README.md#step-3-import-the-modules-and-components)

## Step 4: Import in component       
    <sunbird-epub-player [playerConfig]="playerConfig" (playerEvent)="playerEvents($event)"
      (telemetryEvent)="playerTelemetryEvents($event)"></sunbird-epub-player>

## Step 5: Send input to render EPUB player

Click to see the input data - [playerConfig](README.md#step-5-send-input-to-render-epub-player)

## Sample code

Click to see the sample code - [sampleCode](https://github.com/Sunbird-Ed/SunbirdEd-mobile-app/blob/release-4.8.0/src/app/player/player.page.html)
<br /><br />
