import { Component, ElementRef, ViewChild, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error_dialog';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatRadioChange } from '@angular/material/radio';
import { UserDetails } from '../email/email.component';
import { MatSnackBar } from '@angular/material/snack-bar';

const ERR_STR = "Sorry! Couldn't fit the necklace. Things you can try: " +
"1. Improve lighting conditions "+
"2. Make the neck more visible " +
"3. Try to be in the middle of the picture.";

const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

const quadratic = (x) => {
  return -1.2939465*Math.pow(10, -4)*x*x + 0.70246836*x - 799.33031;
}

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const parseURL = (url: string) => {
  return url.split("/").slice(0,3).join("/");
}

@Component({
  selector: 'necklace-demo',
  templateUrl: './necklace.component.html',
  styleUrls: ['./necklace.component.css']
})
export class NecklaceComponent implements OnInit {
  @ViewChild("video", {static: false})
  video: ElementRef;
  @ViewChild("canvas", {static: false})
  canvas: ElementRef;
  record = false;
  loading = false;
  downloadPic = false;
  public innerWidth = 0;
  selectedNecklace = "";
  imageURL = "";
  signUpURL = "";
  videoWidth = 0;
  videoHeight = 0;
  bigScreen = false;

  constructor(private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient, public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {
    this.record = false;
    this.loading = false;
    this.downloadPic = false;
    this.selectedNecklace = "1";
    this.imageURL = parseURL(window.location.href) + "/demo/upload/";
    this.signUpURL = parseURL(window.location.href) + "/demo/signup/";
  }

  ngOnInit() {
    if (!isMobile()) {
      this.videoWidth = 1280;
      this.videoHeight = 720;
      this.innerWidth = quadratic(window.innerWidth);
      this.bigScreen = true;
    } else {
      this.videoWidth = 640;
      this.videoHeight = 640;
      this.innerWidth = window.innerWidth-530;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.bigScreen) {
      this.innerWidth =  quadratic(window.innerWidth);
    }
  }

  enableDemo() {
    this.downloadPic = false;
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: this.videoWidth },
          height: { ideal: this.videoHeight },
        },
      }).then(stream => {
        this.record = true;
        this.changeDetectorRef.detectChanges();
        this.video.nativeElement.srcObject = stream;
      }).catch((err) => {this.showError("Error in access to camera: " + err.toString());});
    }
  }

  disableDemo() {
    if (this.video) {
      this.video.nativeElement.srcObject.getVideoTracks().forEach(track => track.stop());
    }
    this.record = false;
  }

  getCSRFToken(resp) {
    const parser = new DOMParser();
    const xmldoc = parser.parseFromString(resp, "text/xml");
    const csrfToken = xmldoc.getElementsByTagName("input")[0].getAttribute("value");
    return csrfToken;
  }

  capture() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 480;
    tempCanvas.height = 640;
    tempCanvas.getContext("2d").drawImage(this.video.nativeElement, (this.videoWidth-480)/2, 0, 480, 640, 0, 0, 480, 640);
    this.disableDemo();
    this.loading = true;

    this.http.get(this.imageURL, {responseType: 'text'}).subscribe(resp => {
      const HTTP_OPTIONS = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': this.getCSRFToken(resp),
        }),
      };

      this.http.post(this.imageURL, {
        "necklace": this.selectedNecklace,
        "data": tempCanvas.toDataURL("image/png"),
      }, HTTP_OPTIONS)
        .subscribe(resp => {
          this.loading = false;
          if(resp["data"] === "") {
            this.showError(ERR_STR);
            return
          }
          this.downloadPic = true;
          const checkCanvas = setInterval(()=> {
            var ctx = this.canvas.nativeElement.getContext("2d");
            var img = new Image();
            img.onload = function() {
              ctx.drawImage(img, 0, 0);
            }
            const blob = b64toBlob(resp["data"], "image/png");
            img.src = URL.createObjectURL(blob);

            clearInterval(checkCanvas);
          }, 100);
        }, err => {
          this.loading = false;
          this.showError(ERR_STR);
      });
    }, err => {
      this.loading = false;
      this.showError(ERR_STR)
    });
  }

  download() {
    const link = document.createElement('a');
    link.download = "virtual_necklace.png";
    link.target = '_blank';
    link.href = this.canvas.nativeElement.toDataURL('image/png');
    link.click();
  }

  showError(err: string) {
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '600vw',
      data: {message: err},
    });
  }

  stepperChange(event: StepperSelectionEvent) {
    if(event.selectedIndex == 1){
      this.enableDemo();
    } else {
      this.disableDemo();
    }
  }

  selectionChange(event: MatRadioChange) {
    this.selectedNecklace = event.value;
  }

  onSignUp(event: UserDetails) {
    this.http.get(this.signUpURL, {responseType: 'text'}).subscribe(resp => {
      const HTTP_OPTIONS = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencode',
          'X-CSRFToken': this.getCSRFToken(resp),
        }),
      };
      this.http.post(this.signUpURL, event, HTTP_OPTIONS)
        .subscribe(resp => {
          this._snackBar.open("Successfully signed up!", "",{
            duration: 7000,
          });
        }, err => {
          this.showError(err.error);
        });
    });
  }
}
