
  import { Injectable } from '@angular/core';
  import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
  import { Photo } from './Photo';
  import { Observable } from 'rxjs';
  
  @Injectable({
    providedIn: 'root'
  })
  export class PhotoService {
    private baseUrl = 'http://localhost:8080';
    private baseUrl2 = 'http://localhost:8080/photo'; // Updated base URL for photo-related operations


    constructor(private http: HttpClient) {}
    get(): Observable<Photo[]> {
      return this.http.get<Photo[]>(`${this.baseUrl}/photo`);
    }
  
  
    upload(file: File): Observable<HttpEvent<any>> {
      const formData: FormData = new FormData();
      formData.append('file', file);
  
      const req = new HttpRequest('POST', `${this.baseUrl2}/upload`, formData, {
        reportProgress: true,
        responseType: 'json'
      });
  
      return this.http.request(req);
    }
  
    getFiles(): Observable<any> {
      return this.http.get(`${this.baseUrl}/files`);
    }
  
    /*deleteFile(fileName: string): Observable<any> {
      const encodedFileName = encodeURIComponent(fileName);
      return this.http.delete(`${this.baseUrl}/deleteFile/${encodedFileName}`, { responseType: 'text' });
    }*/

    deleteFile(fileName: string): Observable<any> {
      const encodedFileName =(fileName);
      return this.http.delete(`${this.baseUrl}/deleteFile/${encodedFileName}`, { responseType: 'text' });
    }

  // Create multiple photos
  createMultiplePhotos(photos: Photo[]): Observable<Photo[]> {
    return this.http.post<Photo[]>(`${this.baseUrl}/photo/multiple`, photos);
  }

  // Update a photo
  updatePhoto(id: number, photo: Photo): Observable<Photo> {
    return this.http.put<Photo>(`${this.baseUrl}/photos/${id}`, photo);
  }

  // Delete a photo by ID
  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/photos/${id}`);
  }

  // Upload a single photo
  uploadPhoto(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.baseUrl}/upload`, formData);
  }

  // Upload multiple photos
  uploadMultiplePhotos(files: File[]): Observable<any[]> {
    const formData: FormData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.http.post<any[]>(`${this.baseUrl}/uploadMultiple`, formData);
  }





  getAllPhotos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl2);
  }
  }
  