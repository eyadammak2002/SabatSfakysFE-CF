import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PhotoService } from './photo.service';
import { Photo } from './Photo';
import { Observable } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';


@Component({
  selector: 'app-photo',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    
  ],
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss']
})
export class PhotoComponent {


 
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  message = '';

  fileInfos?: Observable<any>;

  constructor(private photoService: PhotoService
    ,private router:Router,
  ) {}
  selectFiles(event: any): void {
    this.selectedFiles = event.target.files;
    this.currentFiles = Array.from(this.selectedFiles || []);
    this.progressInfos = this.currentFiles.map(file => ({ value: 0, fileName: file.name }));
  }

  upload(): void {
    this.message = '';

    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const files: FileList = this.selectedFiles;

      Array.from(files).forEach((file, index) => {
        this.uploadFile(file, index);
      });
    }
  }

  uploadFile(file: File, index: number): void {
    if (!file) return;
  
    this.photoService.upload(file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Update progress info for the current file
          this.progressInfos[index].value = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          // Success message and refresh the file list
          this.message = 'Upload successful.';
          this.fileInfos = this.photoService.getFiles();  // Refresh file list
        }
      },
      error: (err: any) => {
        // Reset progress and show error message
        this.progressInfos[index].value = 0;
        this.message = `Could not upload the file ${file.name}`;
      }
    });
  }
  
  openDeleteModal(fileName: string): void {
    // Afficher une boîte de dialogue de confirmation
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer le fichier ${fileName}?`);
  
    if (confirmDelete) {
      this.deleteFile(fileName);
    }
  }
  
  deleteFile(fileName: string): void {
    this.photoService.deleteFile(fileName).subscribe({
      next: (response) => {
        this.message = response;
        this.fileInfos = this.photoService.getFiles();
      },
      error: (err) => {
        console.log(err);
        this.message = 'Could not delete the file!';
      }
    });
  }
  

  ngOnInit(): void {
    this.fileInfos = this.photoService.getFiles();

  }
 
 
  


    getEditPhotoUrl(id: number): string {
      return `/editPhoto/${id}`;
    }

  redirectToCreatePhoto() {
    this.router.navigate(['/createPhoto']);
  }



// Inject Router in the component constructor


navigateToEditPhoto(photoId: number): void {
    this.router.navigate(['/editPhoto', photoId]);
}

}

