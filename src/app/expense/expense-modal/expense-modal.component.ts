import { Component, NgIterable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { CategoryService } from '../../category/category.service';
import { FormBuilder } from '@angular/forms';
import { ToastService } from '../../shared/service/toast.service';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  categories: (NgIterable<unknown> & NgIterable<any>) | undefined | null;
  category: any;
  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly categoryService: CategoryService,
    private readonly formBuilder: FormBuilder,
    private readonly toastService: ToastService,
  ) {}

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.modalCtrl.dismiss(null, 'save');
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => this.modalCtrl.dismiss(null, 'delete'));
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }
}
