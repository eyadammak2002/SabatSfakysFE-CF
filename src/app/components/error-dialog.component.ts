// error-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  template: `
    <div class="error-dialog-header">
      <h2>{{data.title}}</h2>
    </div>
    <div class="error-dialog-content">
      <p>{{data.message}}</p>
    </div>
    <div class="error-dialog-actions">
      <button mat-button [mat-dialog-close]="true" color="primary">Fermer</button>
    </div>
  `,
  styles: [`
    .error-dialog-header {
      color: #f44336;
      padding: 16px 16px 0;
    }
    .error-dialog-content {
      padding: 16px;
    }
    .error-dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
    }
  `]
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      message: string;
    }
  ) {}
}