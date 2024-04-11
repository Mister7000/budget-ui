import { Component, NgIterable, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, filter, finalize, from, mergeMap } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { CategoryService } from '../../category/category.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../shared/service/toast.service';
import { ExpenseService } from '../expense.service';
import { Category, Expense } from '../../shared/domain';
import { format, formatISO, parseISO } from 'date-fns';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent implements OnInit {
  ngOnInit(): void {
    const { id, amount, category, date, name } = this.expense;
    if (category) this.categories.push(category);
    if (id) this.expenseForm.patchValue({ id, amount, categoryId: category?.id, date, name });
    this.loadAllCategories();
  }
  categories: Category[] = [];
  expense: Expense = {} as Expense;
  categoryForm: any | Event;
  submitting = false;

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly expenseService: ExpenseService,
    private readonly formBuilder: FormBuilder,
    private readonly toastService: ToastService,
    private readonly categoryService: CategoryService,
  ) {
    this.expenseForm = this.formBuilder.group({
      id: [],
      categoryId: [],
      name: ['', [Validators.required, Validators.maxLength(40)]],
      amount: [],
      date: [formatISO(new Date())],
    });
  }
  readonly expenseForm: FormGroup;
  category: any;

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitting = true;
    this.expenseService
      .upsertExpense({ ...this.expenseForm.value, date: format(parseISO(this.expenseForm.value.date), 'dd-MM-yyyy') })
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense saved');
          this.modalCtrl.dismiss(null, 'refresh');
          this.submitting = false;
        },
        error: (error) => {
          this.toastService.displayErrorToast('Could not save category', error);
          this.submitting = false;
        },
      });
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

  private loadAllCategories(): void {
    const pageToLoad = new BehaviorSubject(0);
    pageToLoad
      .pipe(mergeMap((page) => this.categoryService.getCategories({ page, size: 25, sort: 'name,asc' })))
      .subscribe({
        next: (categories) => {
          if (pageToLoad.value === 0) this.categories = [];
          this.categories.push(...categories.content);
          if (!categories.last) pageToLoad.next(pageToLoad.value + 1);
        },
        error: (error) => this.toastService.displayErrorToast('Could not load categories', error),
      });
  }
}
