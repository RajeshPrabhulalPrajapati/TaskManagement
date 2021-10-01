import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import { Observable, of } from 'rxjs';
import { Note } from 'src/app/models/note';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private ipc: IpcRenderer | undefined;
  constructor() {
    if ((<any>window).require) {
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('App not running inside Electron!');
    }
  };

  addNote(note: Note): Observable<any> {
    return of(
      this.ipc?.send('add-note', note));
  }
  updateNote(note: Note): Observable<any> {
    return of(
      this.ipc?.send('update-note', note));
  }
  deleteNote(noteId: string): Observable<any> {
    return of(
      this.ipc?.send('delete-note', noteId));
  }
  getNotes(): Observable<any> {
    return of(
      this.ipc?.send('get-notes',""));
  }
  
}
