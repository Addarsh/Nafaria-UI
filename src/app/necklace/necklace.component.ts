import { Component, ElementRef, ViewChild, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error_dialog';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatRadioChange } from '@angular/material/radio';
import { UserDetails } from '../email/email.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Gtag } from 'angular-gtag';

// Event Category used for Google Analytics.
const ENGAGEMENT_CATEGORY = "engagement"

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
    private gtag: Gtag,
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
      this.innerWidth = -145;
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
    if(this.bigScreen) {
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
          this.gtag.event('record_video', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: 'User consented to record',
          });
        }).catch((err) => {
          this.showError("Error in access to camera: " + err.toString());
          this.gtag.event('reject_video', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: 'User rejected permission to record',
          });
        });
      }else if(!navigator.mediaDevices) {
        this.gtag.event('reject_video', {
          event_category: ENGAGEMENT_CATEGORY,
          event_label: 'Media Device does not exist',
        });
      }
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

    this.uploadImage(tempCanvas.toDataURL("image/png"));
  }

  uploadImage(base64Image) {
    this.loading = true;

    this.gtag.event('snap_photo', {
      event_category: ENGAGEMENT_CATEGORY,
      event_label: 'Captured user picture',
    });


    this.http.get(this.imageURL, {responseType: 'text'}).subscribe(resp => {
      const HTTP_OPTIONS = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': this.getCSRFToken(resp),
        }),
      };

      const startTime = Date.now();
      this.http.post(this.imageURL, {
        "necklace": this.selectedNecklace,
        "data": base64Image,
      }, HTTP_OPTIONS)
        .subscribe(resp => {
          this.loading = false;
          if(resp["data"] === "") {
            if(parseInt(resp["size"]) > 182) {
              this.showError("Sorry! You might be too CLOSE, please move further away and take a picture.");
              this.gtag.event('detection_error', {
                event_category: ENGAGEMENT_CATEGORY,
                event_label: 'User too close to camera',
                value: resp["size"],
              });
            }else {
              this.showError("Sorry! Could not detect your neck. Please make your neck is visible"
              + " or adjust lighting conditions.");
              this.gtag.event('detection_error', {
                event_category: ENGAGEMENT_CATEGORY,
                event_label: 'Neck Undetected',
                value: resp["size"],
              });
            }
            return;
          }

          this.gtag.event('detection_success', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: 'Neck overlay success',
            value: resp["size"],
          });

          this.gtag.event('detection_time', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: 'Succesful Necklace Overlay time',
            value: Date.now() - startTime,
          });

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
          this.showError("Sorry! Our server encountered an error during processing. Please try again.");
          this.gtag.event('detection_error', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: 'Server error during image processing',
          });
      });
    }, err => {
      this.loading = false;
      this.showError("Request to our server did not go through. Check your internet connection and try again.");
      this.gtag.event('csrf_token_error', {
        event_category: ENGAGEMENT_CATEGORY,
        event_label: 'GET request failed for CSRF token',
      });
    });
  }

  download() {
    let label = "Result Image Downloaded";
    if (!this.bigScreen) {
      label = "Result Image Shared";
    }

    this.gtag.event('use_result_image', {
      event_category: ENGAGEMENT_CATEGORY,
      event_label: label,
    });

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
    this.gtag.event('necklace_selection_change', {
      event_category: ENGAGEMENT_CATEGORY,
      event_label: this.selectedNecklace,
    });
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
          this.gtag.event('user_signup', {
            event_category: ENGAGEMENT_CATEGORY,
            event_label: "User signed up",
          });
        }, err => {
          this.showError(err.error);
        });
    });
  }

  optionsClicked(nav: string) {
    this.gtag.event('page_navigation_clicked', {
      event_category: ENGAGEMENT_CATEGORY,
      event_label: nav,
    });
  }

  onFileSelected(event) {
    let file = null;
    let fileList = event.target.files;

    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].type.match(/^image\//)) {
        file = fileList[i];
        break;
      }
    }

    if (file !== null) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      var self = this;
      reader.onload = function () {
        self.uploadImage(reader.result);
      };
      reader.onerror = function (error) {
        self.showError("Image is corrupt; Please try again.");
      };
    } else {
      this.showError("Invalid image format; Please try again.");
    }
  }
}
