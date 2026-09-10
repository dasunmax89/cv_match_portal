import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterLayout } from './recruiter-layout.component';

describe('RecruiterLayout', () => {
  let component: RecruiterLayout;
  let fixture: ComponentFixture<RecruiterLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecruiterLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(RecruiterLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
