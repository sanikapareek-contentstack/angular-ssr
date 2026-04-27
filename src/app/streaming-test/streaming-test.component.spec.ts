import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamingTestComponent } from './streaming-test.component';

describe('StreamingTestComponent', () => {
  let component: StreamingTestComponent;
  let fixture: ComponentFixture<StreamingTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingTestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StreamingTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
