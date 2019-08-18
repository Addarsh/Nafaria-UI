import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';

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

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    this.width = "480";
    this.height = "640";
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
    this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, +this.width, +this.height);
  }
}
