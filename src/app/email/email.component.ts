import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export interface UserDetails {
  email: string;
  comments: string;
}

@Component({
  selector: 'user-details',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.css']
})
export class EmailComponent implements OnInit {
  @Output() formSubmit = new EventEmitter();
  userForm: FormGroup;

  ngOnInit() {
    this.userForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      comments: new FormControl(''),
    });
  }

  onSubmit() {
    this.formSubmit.emit({
      email: this.userForm.value.email,
      comments: this.userForm.value.comments,
    });
    this.userForm.reset();
  }
}
