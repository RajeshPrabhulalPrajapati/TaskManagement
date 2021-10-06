import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Annyang } from 'annyang';
import { IpcRenderer } from 'electron';
import { interval } from 'rxjs';
import { Note } from 'src/app/models/note';
import { AuthService } from 'src/Services/auth-service.service';
import { CommonService } from 'src/Services/common.service';
import { v4 as uuidv4 } from 'uuid';
declare var annyang: Annyang;

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  private ipc: IpcRenderer | undefined;
  formData: FormGroup;
  notes: Note[] = [];
  isEdit: boolean = false;
  tmpId: string = '';
  priorities = ["Lower", "Medium", "Higher"];
  @ViewChild('myDiv') myInput: ElementRef | undefined;
  @ViewChild('voiceInput') voiceInput: ElementRef | undefined;
  voiceActiveSectionDisabled: boolean = true;
  voiceActiveSectionError: boolean = false;
  voiceActiveSectionSuccess: boolean = false;
  voiceActiveSectionListening: boolean = false;
  voiceText: any;
  tmpAnnyang: any;
  toggleValue = false;
  isoStr = new Date().toISOString();
  currDate:any = this.isoStr.substring(0,this.isoStr.length-8);

  constructor(private commonService: CommonService, private ngZone: NgZone, private authService: AuthService, private router: Router) {
    this.formData = new FormGroup({
      priority: new FormControl("1", Validators.required),
      title: new FormControl("", Validators.required),
      content: new FormControl("", Validators.required),
      todo: new FormControl("", Validators.required),
      notificationDateTime: new FormControl(""),
      notification: new FormControl(false)
    });

    if ((<any>window).require) {
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('App not running inside Electron!');
    }

    this.ipc?.on('test', (event, msg) => {
      console.log(msg);
    });

    this.ipc?.on('update_available', () => {
      console.log('update_available');
      const message = document.getElementById('message');
      const notification = document.getElementById('notification');

      this.ipc?.removeAllListeners('update_available');
      message ? message.innerText = 'A new update is available. Downloading now...' : "";
      notification ? notification.classList.remove('hidden') : "";

    });
    this.ipc?.on('update_downloaded', () => {
      console.log('update_downloaded');
      const message = document.getElementById('message');
      const notification = document.getElementById('notification');
      const restartButton = document.getElementById('restart-button');

      this.ipc?.removeAllListeners('update_downloaded');;
      message ? message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?' : "";
      restartButton ? restartButton.classList.remove('hidden') : "";
      notification ? notification.classList.remove('hidden') : "";
    });

    this.ipc?.on('info', (event, msg) => {
      console.log('info ', msg)
    });

    this.ipc?.on('err', (event, msg) => {
      console.log('err ', msg)
    });

  }

  checkForNotification() {
    if (this.notes.length > 0) {
      const currDate = new Date();
      currDate.setSeconds(0);     
      this.notes.map(n => {
        const tmpDate = new Date(n.notificationDateTime);
        tmpDate.setSeconds(0);   
        if (tmpDate.getFullYear() === currDate.getFullYear() &&
          tmpDate.getMonth() === currDate.getMonth() &&
          tmpDate.getDate() === currDate.getDate() &&
          tmpDate.getHours() === currDate.getHours() && 
          tmpDate.getMinutes() === currDate.getMinutes()) {     
          this.ipc?.send('showNotification',n.title);
        }
      });     
    }
  }

  ngOnInit(): void {

    interval(50000).subscribe(x => {
      this.checkForNotification();
    });

    this.commonService.getNotes().subscribe((notes) => { });

    this.ipc?.on('noteList', (event, data) => {
      console.log("res =>", data);
      this.notes = [];
      data.map((d: any) => {
        let note = {} as Note;
        note.noteId = d.NoteId;
        note.content = d.Content;
        note.todo = d.Todo;
        note.priority = d.Priority;
        note.title = d.Title;
        note.notificationDateTime = d.NotificationDateTime;
        note.notification = d.Notification ? true : false;
        this.notes.push(note);
      });
      console.log("empList =>", this.notes);

    });

  }

  ngAfterViewInit() {
    setTimeout(() => {
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.0/annyang.min.js";
      this.voiceInput?.nativeElement.appendChild(s);
      // console.log("annyang",annyang);
      this.myInput?.nativeElement.click();
    }, 1000);

  }

  startRecording() {
    this.ipc?.send('startRecording');
  }

  endRecording() {
    this.ipc?.send('endRecording');
  }

  closeNotification() {
    const notification = document.getElementById('notification');
    notification ? notification.classList.add('hidden') : "";
  }

  restartApp() {
    this.ipc?.send('restart_app');
  }

  initializeVoiceRecognitionCallback(): void {
    this.tmpAnnyang.addCallback('error', (err: any) => {
      if (err.error === 'network') {
        this.voiceText = "Internet is require";
        this.tmpAnnyang.abort();
        this.ngZone.run(() => this.voiceActiveSectionSuccess = true);
      } else if (this.voiceText === undefined) {
        this.ngZone.run(() => this.voiceActiveSectionError = true);
        this.tmpAnnyang.abort();
      }
    });

    this.tmpAnnyang.addCallback('soundstart', (res: any) => {
      this.ngZone.run(() => this.voiceActiveSectionListening = true);
    });

    this.tmpAnnyang.addCallback('end', () => {
      if (this.voiceText === undefined) {
        this.ngZone.run(() => this.voiceActiveSectionError = true);
        this.tmpAnnyang.abort();
      }
    });

    this.tmpAnnyang.addCallback('result', (userSaid: any) => {
      this.ngZone.run(() => this.voiceActiveSectionError = false);

      let queryText: any = userSaid[0];

      this.tmpAnnyang.abort();

      this.voiceText = queryText;
      this.formData.controls.content.patchValue(this.voiceText);

      this.ngZone.run(() => this.voiceActiveSectionListening = false);
      this.ngZone.run(() => this.voiceActiveSectionSuccess = true);
    });
  }

  startVoiceRecognition(): void {
  
    this.voiceActiveSectionDisabled = false;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceText = undefined;

    if (this.tmpAnnyang) {
      let commands = {
        'demo-annyang': () => { }
      };

      this.tmpAnnyang.addCommands(commands);

      this.initializeVoiceRecognitionCallback();

      this.tmpAnnyang.start({ autoRestart: false });
     
    }
  }

  closeVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = true;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceActiveSectionListening = false;
    this.voiceText = undefined;

    if (this.tmpAnnyang) {
      this.tmpAnnyang.abort();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
  }

  addUpdateNote() {
    if (this.isEdit) {
      let note = this.notes.find(n => n.noteId == this.tmpId);
      if (note) {
        note.title = this.formData.value.title;
        note.content = this.formData.value.content;
        note.todo = this.formData.value.todo;
        note.priority = this.formData.value.priority;
         note.notificationDateTime = this.formData.value.notificationDateTime;
      note.notification = this.formData.value.notification;
        this.commonService.updateNote(note).subscribe((res) => { });
      }
    }
    else {
      let note: Note = {} as Note;
      note.noteId = uuidv4();
      note.notificationDateTime = this.formData.value.notificationDateTime;
      note.notification = this.formData.value.notification;
      note.priority = this.formData.value.priority;
      note.title = this.formData.value.title;
      note.content = this.formData.value.content;
      note.todo = this.formData.value.todo;
      this.notes.push(note);
      this.commonService.addNote(note).subscribe((res) => { });
    }
    this.resetNotes();
  }
  onToggleChange()
  {
    if(this.formData.value.notification)
    {
      let tmpDate = new Date();
      tmpDate.setHours(tmpDate.getHours()+6);
      let tmpDate2 = tmpDate.toISOString();   
      this.formData.controls.notificationDateTime.patchValue(tmpDate2.substring(0,tmpDate2.length-8));
    }
    else
    {
      this.formData.controls.notificationDateTime.patchValue("");
    }
  }

  resetNotes() {
    this.isEdit = false;
    this.tmpId = '';
    this.formData.reset();
    this.formData.controls.priority.patchValue("1");
    this.formData = new FormGroup({
      priority: new FormControl("1", Validators.required),
      title: new FormControl("", Validators.required),
      content: new FormControl("", Validators.required),
      todo: new FormControl("", Validators.required),
      notificationDateTime: new FormControl(""),
      notification: new FormControl(false)
    });
    this.notes.sort((a, b) => (a.priority > b.priority ? -1 : 1));
    this.toggleValue = false;
    this.checkForNotification();
  }



  editNote(noteId: string) {
    this.isEdit = true;
    this.tmpId = noteId;
    const note = this.notes.find(n => n.noteId == noteId);

    this.formData.setValue({
      title: note?.title,
      content: note?.content,
      todo: note?.todo,
      priority: note?.priority,
      notification: note?.notification,
      notificationDateTime: note?.notificationDateTime
    });
  }

  deleteNote(noteId: string) {
    const note = this.notes.find(n => n.noteId == noteId);
    note ? this.notes.splice(this.notes.indexOf(note), 1) : '';
    this.commonService.deleteNote(noteId).subscribe((res) => { });
    this.tmpId = '';
  }

}
