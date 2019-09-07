import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NecklaceComponent } from './necklace/necklace.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ErrorDialogComponent } from './necklace/error_dialog';
import { EmailComponent } from './email/email.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GtagModule } from 'angular-gtag';

@NgModule({
  declarations: [
    AppComponent,
    NecklaceComponent,
    ErrorDialogComponent,
    EmailComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    HttpClientModule,
    MatProgressBarModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatCardModule,
    FlexLayoutModule,
    MatExpansionModule,
    MatStepperModule,
    MatIconModule,
    MatGridListModule,
    MatRadioModule,
    MatInputModule,
    MatSnackBarModule,
    GtagModule.forRoot({ trackingId: 'UA-147371517-1', trackPageviews: true }),
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ErrorDialogComponent],
})
export class AppModule { }
