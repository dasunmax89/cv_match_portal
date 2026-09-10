import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementLayout } from './management-layout.component';

describe('ManagementLayout', () => {
  let component: ManagementLayout;
  let fixture: ComponentFixture<ManagementLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
