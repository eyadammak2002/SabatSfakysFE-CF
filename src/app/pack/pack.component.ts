import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pack.component.html',
  styleUrl: './pack.component.scss'
})
export class PackComponent {
packs: any;

}
