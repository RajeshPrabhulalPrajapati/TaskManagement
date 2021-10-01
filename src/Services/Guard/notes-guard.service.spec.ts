import { TestBed } from '@angular/core/testing';

import { NotesGuardService } from './notes-guard.service';

describe('NotesGuardService', () => {
  let service: NotesGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotesGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
