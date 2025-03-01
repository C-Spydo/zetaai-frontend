import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ChatComponent {
  @ViewChild('chatBox') chatBox!: ElementRef;
  
  username: string = localStorage.getItem('chat_username') || '';
  message: string = '';
  selectedCharacter: string = 'Peter';
  customCharacterName: string = '';
  customCharacterDescription: string = '';
  chatHistory: { text: string; isUser: boolean }[] = [];

  characterOptions = [
    { value: 'Peter', label: 'Peter - Nigerian Bank Worker' },
    { value: 'Femi', label: 'Femi - PhD in Economics & Statistics' },
    { value: 'Amaka', label: 'Amaka - Informal Businesswoman' },
    { value: 'Chief', label: 'Chief - Well-traveled Nigerian Big Man' },
    { value: 'Tade', label: 'Tade - 22yo University Student' },
    { value: 'Custom', label: '➕ Add Custom Character' }
  ];

  apiUrl = 'https://zeta-ai-api.onrender.com/chat';

  constructor() {
    if (!this.username) {
      this.username = prompt('Enter your username:')?.trim() || 'User';
      localStorage.setItem('chat_username', this.username);
    }
    this.loadChatHistory();
  }

  async loadChatHistory() {
    try {
      const response = await fetch(`https://zeta-ai-api.onrender.com/chat-history?username=${this.username}`);
      const data = await response.json();
      if (data.data.chat_memory) {
        const historyLines = data.data.chat_memory.split('\n');
        historyLines.forEach((line :any)=> {
          if (line.startsWith('User:')) {
            this.chatHistory.push({ text: line.replace('User:', '').trim(), isUser: true });
          } else if (line.startsWith('AI:')) {
            this.chatHistory.push({ text: line.replace('AI:', '').trim(), isUser: false });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  async sendMessage() {
    if (!this.message.trim()) return;
    
    const characterDescription = this.selectedCharacter === 'Custom' ?
      this.customCharacterDescription : this.getCharacterDescription(this.selectedCharacter);
    
    this.chatHistory.push({ text: this.message, isUser: true });
    const userMessage = this.message;
    this.message = '';
    this.scrollToBottom();

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          system_message: characterDescription,
          username: this.username
        })
      });
      const data = await response.json();
      this.chatHistory.push({ text: data.data.ai_response || 'No response', isUser: false });
      this.scrollToBottom();
    } catch (error) {
      this.chatHistory.push({ text: 'Error fetching response', isUser: false });
      console.error(error);
    }
  }

  getCharacterDescription(character: string): string {
    const descriptions: { [key: string]: string } = {
      'Peter': 'You are a Nigerian middle-aged bank worker.',
      'Femi': 'You are a PhD holder in economics & statistics.',
      'Amaka': 'You are a businesswoman who likes to speak informal English a lot.',
      'Chief': 'You are a Nigerian big man, well-traveled and use lots of big English words.',
      'Tade': 'You are a 22-year-old Nigerian university student.'
    };
    return descriptions[character] || 'A custom personality defined by the user.';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
    }, 100);
  }

  startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => console.log('Listening...');
    recognition.onresult = (event: any) => {
      this.message = event.results[0][0].transcript;
    };
    recognition.onerror = () => alert('Voice recognition failed. Try again.');
    recognition.start();
  }
}
