import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Annyang } from 'annyang';
import { IpcRenderer } from 'electron';
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
  priorities=["Lower","Medium","Higher"];
  @ViewChild('myDiv') myInput: ElementRef | undefined;
  voiceActiveSectionDisabled: boolean = true;
	voiceActiveSectionError: boolean = false;
	voiceActiveSectionSuccess: boolean = false;
	voiceActiveSectionListening: boolean = false;
	voiceText: any;

  constructor(private commonService : CommonService,private ngZone: NgZone,private authService: AuthService, private router: Router) {
    this.formData = new FormGroup({
      priority: new FormControl("1", Validators.required),
      title: new FormControl("", Validators.required),
      content: new FormControl("", Validators.required),
      todo: new FormControl("", Validators.required),
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

  }

  ngOnInit(): void {

    this.commonService.getNotes().subscribe((notes)=>{ });

    this.ipc?.on('noteList', (event, data) => {
      console.log("res =>", data);
      this.notes =[];
        data.map((d:any) => {
        let note = {} as Note;
        note.noteId = d.NoteId;
        note.content = d.Content;
        note.todo = d.Todo;
        note.priority = d.Priority;
        note.title = d.Title;
        this.notes.push(note);
      });
      console.log("empList =>", this.notes);
      
    });
 
  }

  ngAfterViewInit()
  {
    setTimeout(() => {
      this.myInput?.nativeElement.click();  
    }, 1000);
     
  }

  initializeVoiceRecognitionCallback(): void {
		annyang.addCallback('error', (err:any) => {
      if(err.error === 'network'){
        this.voiceText = "Internet is require";
        annyang.abort();
        this.ngZone.run(() => this.voiceActiveSectionSuccess = true);
      } else if (this.voiceText === undefined) {
				this.ngZone.run(() => this.voiceActiveSectionError = true);
				annyang.abort();
			}
		});

		annyang.addCallback('soundstart', (res:any) => {
      this.ngZone.run(() => this.voiceActiveSectionListening = true);
		});

		annyang.addCallback('end', () => {
      if (this.voiceText === undefined) {
        this.ngZone.run(() => this.voiceActiveSectionError = true);
				annyang.abort();
			}
		});

		annyang.addCallback('result', (userSaid:any) => {
			this.ngZone.run(() => this.voiceActiveSectionError = false);

			let queryText: any = userSaid[0];

			annyang.abort();

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

		if (annyang) {
			let commands = {
				'demo-annyang': () => { }
			};

			annyang.addCommands(commands);

      this.initializeVoiceRecognitionCallback();

			annyang.start({ autoRestart: false });
		}
	}

	closeVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = true;
		this.voiceActiveSectionError = false;
		this.voiceActiveSectionSuccess = false;
		this.voiceActiveSectionListening = false;
		this.voiceText = undefined;

		if(annyang){
      annyang.abort();
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
        this.commonService.updateNote(note).subscribe((res)=>{});
      }
    }
    else {
      let note: Note = {} as Note;
      note.noteId = uuidv4();
      note.priority = this.formData.value.priority;
      note.title = this.formData.value.title;
      note.content = this.formData.value.content;
      note.todo = this.formData.value.todo;
      this.notes.push(note);
      this.commonService.addNote(note).subscribe((res)=>{});
    }
    this.resetNotes();
  }

  resetNotes() {
    this.isEdit = false;
    this.tmpId = '';
    this.formData.reset();
    this.formData.controls.priority.patchValue("1");
    this.notes.sort((a, b) => (a.priority > b.priority ? -1 : 1));
  }



  editNote(noteId: string) {
    this.isEdit = true;
    this.tmpId = noteId;
    const note = this.notes.find(n => n.noteId == noteId);

    this.formData.setValue({
      title: note?.title,
      content: note?.content,
      todo: note?.todo,
      priority: note?.priority
    });
  }

  deleteNote(noteId: string) {
    const note = this.notes.find(n => n.noteId == noteId);
    note ? this.notes.splice(this.notes.indexOf(note), 1) : '';
    this.commonService.deleteNote(noteId).subscribe((res)=>{});
    this.tmpId = '';
  }

}
