import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  webRTC = false;

  constructor(private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient) {
    this.width = "1280";
    this.height = "720";
    this.webRTC = false;
  }

  ngOnInit() {}

  enableDemo() {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { min: +this.width, ideal: +this.width },
          height: { min: +this.height, ideal: +this.height},
        },
      }).then(stream => {
        this.webRTC = true;
        this.changeDetectorRef.detectChanges();
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      }).catch((err) => {console.log('Promise Rejected: ', err);});
    }
  }

  disableDemo() {
    if(this.webRTC) {
      this.video.nativeElement.srcObject.getVideoTracks().forEach(track => track.stop());
      this.webRTC = false;
    }
  }

  capture() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = +this.width;
    tempCanvas.height = +this.height;
    tempCanvas.getContext("2d").drawImage(this.video.nativeElement, 0, 0, +this.width, +this.height);

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
          var ctx = this.canvas.nativeElement.getContext("2d");
          var img = new Image();
          img.onload = function() {
            ctx.drawImage(img, 0, 0);
          }
          if(resp["data"] != ""){
            const blob = b64toBlob(resp["data"], "image/png");
            img.src = URL.createObjectURL(blob);
          } else {
            console.log("Sorry! Couldn't fit the necklace");
          }
        }, err => {
          console.log("POST image error: ", err);
      });
    }, err => {
      console.log("GET image error: ", err);
    });
  }
}
