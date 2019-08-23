import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'user-details',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.css']
})
export class EmailComponent {
  emailForm = new FormGroup({
    email: new FormControl(''),
    comments: new FormControl(''),
  });

  constructor() { }

  onSubmit() {
    console.log("Form submitted: ", this.emailForm.value);
  }
}
