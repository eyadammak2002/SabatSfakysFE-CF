import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatbotService, Message } from 'src/app/services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  userMessage = '';
  messages: Message[] = [];
  isLoading = true;
  
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  constructor(private chatbotService: ChatbotService) { }
  
  ngOnInit(): void {
    // S'abonner aux messages
    this.chatbotService.messages$.subscribe(messages => {
      this.messages = messages;
    });
    
    // Vérifier si le modèle est chargé
    this.chatbotService.isModelLoaded().subscribe(loaded => {
      this.isLoading = !loaded;
      if (loaded) {
        // Ajouter un message de bienvenue
        this.chatbotService.sendMessage('Bonjour');
      }
    });
  }
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
  
  sendMessage(): void {
    if (this.userMessage.trim() === '') return;
    
    this.chatbotService.sendMessage(this.userMessage);
    this.userMessage = '';
  }
  
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}