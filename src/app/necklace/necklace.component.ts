import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error_dialog';

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
  width = "";
  height = "";
  record = false;
  loading = false;
  downloadPic = false;

  constructor(private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient, public dialog: MatDialog) {
    this.width = "";
    this.height = "";
    this.record = false;
    this.loading = false;
    this.downloadPic = false;
  }

  ngOnInit() {}

  enableDemo() {
    this.width = "1280";
    this.height = "720";
    this.downloadPic = false;
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { min: +this.width, ideal: +this.width },
          height: { min: +this.height, ideal: +this.height},
        },
      }).then(stream => {
        this.record = true;
        this.changeDetectorRef.detectChanges();
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      }).catch((err) => {this.showError("Error in access to camera");});
    }
  }

  disableDemo() {
    this.video.nativeElement.srcObject.getVideoTracks().forEach(track => track.stop());
    this.record = false;

    // Reset canvas to necklace overlay size.
    this.width = "480";
    this.height = "600";
  }

  capture() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = +this.width;
    tempCanvas.height = +this.height;
    tempCanvas.getContext("2d").drawImage(this.video.nativeElement, 0, 0, +this.width, +this.height);
    this.disableDemo();
    this.loading = true;

    this.http.get("http://localhost:8000/demo/upload/", {responseType: 'text'}).subscribe(resp => {
      const parser = new DOMParser();
      const xmldoc = parser.parseFromString(resp, "text/xml");
      const csrfToken = xmldoc.getElementsByTagName("input")[0].getAttribute("value");

      const HTTP_OPTIONS = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
        }),
      };

      this.http.post("http://localhost:8000/demo/upload/", tempCanvas.toDataURL("image/png"), HTTP_OPTIONS)
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
    link.href = this.canvas.nativeElement.toDataURL('image/png').replace("image/png", "image/octet-stream");
    link.click();
  }

  showError(err: string) {
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '600px',
      data: {message: err},
    });
  }
}
