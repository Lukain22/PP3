import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  
  userLoginOn: boolean = false;
  constructor() { } 
  ngOnInit(): void {
}

}
