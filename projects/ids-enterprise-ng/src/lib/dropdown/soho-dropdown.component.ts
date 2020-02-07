/// <reference path="soho-dropdown.d.ts" />

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  NgZone,
  Self,
  Optional,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import {
  NgControl,
  ControlValueAccessor
} from '@angular/forms';

/**
 * Angular wrapper for the `dropdown` widget in the ids-enterprise controls.
 */
@Component({
  selector: 'select[soho-dropdown]', // tslint:disable-line
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SohoDropDownComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  /**
   * Used to provide unnamed controls with a unique id.
   */
  private static counter = 0;

  /**
   * Flag to force an update of the control after the view is created.
   */
  private runUpdatedOnCheck: boolean;

  /**
   * Integration with the Angular ControlValueAccessor for form controls.
   */
  private valueAccessor: SohoDropDownControlValueAccessorDelegator;

  /**
   * Selector for originating element.
   */
  private jQueryElement: JQuery;

  /**
   * Reference to the IDS Enterprise Api.
   */
  private dropdown: SohoDropDownStatic;

  /**
   * Default block of options, use the accessors to modify.
   */
  private options: SohoDropDownOptions = {
    reload: 'none'
  };

  /**
   * Sets the dropdown to close on selecting a value (helpful for multi-select)
   */
  @Input()
  public set closeOnSelect(closeOnSelect: boolean) {
    this.options.closeOnSelect = closeOnSelect;
    if (this.dropdown) {
      this.dropdown.settings.closeOnSelect = closeOnSelect;
      this.markForRefresh();
    }
  }

  public get closeOnSelect(): boolean {
    return this.options.closeOnSelect;
  }

  /**
   * Append a css class to the dropdown-list
   */
  @Input()
  public set cssClass(cssClass: string) {
    this.options.cssClass = cssClass;
  }

  public get cssClass(): string {
    return this.options.cssClass;
  }

  /**
   * Typing debounce for search
   */
  @Input()
  public set delay(delay: number) {
    this.options.delay = delay;
  }

  public get delay(): number {
    return this.options.delay;
  }

  /**
   * Initialize the empty value
   */
  @Input()
  public set empty(empty: boolean) {
    this.options.empty = empty;
  }

  public get empty(): boolean {
    return this.options.empty;
  }

  /**
   * Value of the maximum number of selected elements (must have multiple set to true)
   */
  @Input()
  public set maxSelected(maxSelected: number) {
    this.options.maxSelected = maxSelected;
  }

  public get maxSelected(): number {
    return this.options.maxSelected;
  }

  /**
   * Flag to move the selected values to the top of the dropdown
   *
   * @deprecated use moveSelected
   */
  @Input()
  public set moveSelectedToTop(moveSelectedToTop: boolean) {
    console.warn(`'moveSelectedToTop' has been deprecated, please use 'moveSelected'.`);
    this.options.moveSelectedToTop = moveSelectedToTop;  // tslint:disable-line
  }

  public get moveSelectedToTop(): boolean {
    // tslint:disable-next-line: deprecation
    return this.options.moveSelectedToTop;
  }

  @Input()
  public set moveSelected(moveSelected: SohoDropDownMoveSelectedOptions) {
    this.options.moveSelected = moveSelected;
    if (this.dropdown) {
      this.dropdown.settings.moveSelected = moveSelected;
      this.markForRefresh();
    }
  }

  public get moveSelected(): SohoDropDownMoveSelectedOptions {
    return this.options.moveSelected;
  }

  @Input()
  public set showEmptyGroupHeaders(showEmptyGroupHeaders: boolean) {
    this.options.showEmptyGroupHeaders = showEmptyGroupHeaders;
    if (this.dropdown) {
      this.dropdown.settings.showEmptyGroupHeaders = showEmptyGroupHeaders;
      this.markForRefresh();
    }
  }

  public get showEmptyGroupHeaders(): boolean {
    return this.options.showEmptyGroupHeaders;
  }

  @Input()
  public set sourceArguments(sourceArguments: any) {
    this.options.sourceArguments = sourceArguments;
    if (this.dropdown) {
      this.dropdown.settings.sourceArguments = sourceArguments;
      this.markForRefresh();
    }
  }

  public get sourceArguments(): any {
    return this.options.sourceArguments;
  }

  /**
   * Determines the frequency of reloading data from an external source
   */
  @Input()
  public set reload(reload: SohoDropDownReloadStyles) {
    this.options.reload = reload;
    if (this.dropdown) {
      this.dropdown.settings.reload = reload;
      this.markForRefresh();
    }
  }

  public get reload(): SohoDropDownReloadStyles {
    return this.options.reload;
  }

  /**
   * If set the width of the dropdown is limited to this pixel width.
   * Use 300 for the 300 px size fields. Default is size of the largest data.
   */
  @Input()
  public set maxWidth(maxWidth: number) {
    this.options.maxWidth = maxWidth;
    if (this.dropdown) {
      // @todo this property can not be updated once the control
      // has been initialised.
      this.dropdown.settings.maxWidth = maxWidth;
      this.markForRefresh();
    }
  }

  public get maxWidth(): number {
    return this.options.maxWidth;
  }

  @Input()
  public set filterMode(filterMode: SohoDropDownFilterModeOptions) {
    this.options.filterMode = filterMode;
    if (this.dropdown) {
      this.dropdown.settings.filterMode = filterMode;
      this.markForRefresh();
    }
  }

  public get filterMode(): SohoDropDownFilterModeOptions {
    return this.options.filterMode;
  }

  /**
   * Sets the select element as a multi-select
   */
  @Input()
  public set multiple(multiple: boolean) {
    this.options.multiple = multiple;
    if (this.dropdown) {
      this.dropdown.settings.multiple = multiple;
      this.markForRefresh();
    }
  }

  public get multiple(): boolean {
    return this.options.multiple;
  }

  /**
   * Name for the dropdown control. Necessary for ngModel to function.
   */
  @Input() name = `soho-dropdown-${SohoDropDownComponent.counter++}`;

  /**
   * Flag to add/remove search functionality from the dropdown
   */
  @Input()
  public set noSearch(noSearch: boolean) {
    // Assume any value is true to allow the noSearch attribute to be added
    // without a boolean value.
    const value = noSearch !== null && noSearch as any !== 'false';
    this.options.noSearch = value;
    if (this.dropdown) {
      this.dropdown.settings.noSearch = value;
      this.markForRefresh();
    }
  }

  public get noSearch(): boolean {
    return this.options.noSearch;
  }

  /**
   * Existent as a helper... should use framework's API to get data and
   * then create and pass to the control to use
   */
  @Input()
  public set source(source: SohoDropDownSourceFunction | Object | string) {
    this.options.source = source;
  }

  public get source(): SohoDropDownSourceFunction | Object | string {
    return this.options.source;
  }

  /**
   * Initialize the showSelectAll value for multi-select drop downs
   */
  @Input()
  public set showSelectAll(selectAll: boolean) {
    this.options.showSelectAll = selectAll;
  }

  public get showSelectAll(): boolean {
    return this.options.showSelectAll;
  }

  /**
   * Called when the dropdown value changes
   */
  // tslint:disable-next-line: no-output-rename
  @Output('change')
  change$ = new EventEmitter<JQuery.TriggeredEvent>();

  /**
   * Called when the dropdown updates in some way.
   */
  // tslint:disable-next-line: no-output-rename
  @Output('updated')
  updated$ = new EventEmitter<JQuery.TriggeredEvent>();

  /**
   * Fired when the dropdown list is closed.
   */
  // tslint:disable-next-line: no-output-rename
  @Output('listclosed')
  listClosed$ = new EventEmitter<SohoDropDownEvent>();

  /**
   * Fired when the dropdown list is opened.
   */
  // tslint:disable-next-line: no-output-rename
  @Output('listopened')
  listOpened$ = new EventEmitter<SohoDropDownEvent>();

  /**
   * This event is fired when a key is pressed
   */
  // tslint:disable-next-line: no-output-rename
  @Output('keydown')
  keydown$ = new EventEmitter<Event>();

  /**
   * Bind attributes to the host select element
   */

  /**
   * Assign the id for the control
   * (maps to the name to use on a label's 'for' attribute)
   */
  @HostBinding('id') get id() {
    return this.name;
  }

  @HostBinding('attr.multiple') get isMultiple() {
    return this.options.multiple;
  }

  @HostBinding('class.dropdown') get isDropdown(): boolean {
    return !this.options.multiple;
  }

  @HostBinding('class.multiselect') get isMultiSelect() {
    return this.options.multiple;
  }

  /**
   * Creates an instance of SohoDropDownComponent.
   * @param element the element this component encapsulates.
   * @param ngZone the angualar zone for this component
   * @param ngControl any associated form control (optional)
   *
   */
  constructor(
    private element: ElementRef,
    private ngZone: NgZone,
    @Self() @Optional() public ngControl: NgControl,
    public ref: ChangeDetectorRef) {

    // Is the control using a form control and/or ngModel?
    if (this.ngControl) {
      // Wrap the accessor to allow updates to be pushed,
      // but also use the standard accessors provided by angular.
      this.valueAccessor =
        new SohoDropDownControlValueAccessorDelegator( // tslint:disable-line
          this.ngControl.valueAccessor, this);

      // ... change the accessor on the control to use ours.
      this.ngControl.valueAccessor = this.valueAccessor;
    }
  }

  ngAfterViewInit() {
    // call outside the angular zone so change detection
    // isn't triggered by the soho component.
    this.ngZone.runOutsideAngular(() => {
      // assign element to local variable
      this.jQueryElement = jQuery(this.element.nativeElement);

      this.options.onKeyDown = (e: Event) => this.ngZone.run(() => this.keydown$.next(e));

      // initialise the dropdown control
      this.jQueryElement.dropdown(this.options);

      // extract the api
      this.dropdown = this.jQueryElement.data('dropdown');

      // @todo - add event binding control so we don't bind if not required.
      this.jQueryElement
        .on('change', (event: JQuery.TriggeredEvent) => this.onChanged(event))
        .on('updated', (event: JQuery.TriggeredEvent) => this.onUpdated(event))
        .on('requestend', (event: JQuery.TriggeredEvent, searchTerm: string, data: any[]) => this.onRequestEnd(event, searchTerm, data))
        .on('listclosed', (event: JQuery.TriggeredEvent, action: SohoDropDownEventActions) => this.onListClosed(event, action))
        .on('listopened', (event: JQuery.TriggeredEvent) => this.onListOpened(event));

      this.runUpdatedOnCheck = true;
    });
  }

  ngAfterViewChecked() {
    if (this.runUpdatedOnCheck) {
      this.ngZone.runOutsideAngular(() => {
        // We need to update the control AFTER the model
        // has been updated (assuming there is one), so
        // execute updated after angular has generated
        // the model and the view markup.
        setTimeout(() => this.updated());
        this.runUpdatedOnCheck = false;
      });
    }
  }

  ngOnDestroy() {
    this.ngZone.runOutsideAngular(() => {
      if (this.jQueryElement) {
        // remove the event listeners on this element.
        this.jQueryElement.off();
      }

      // Destroy any widget resources.
      this.dropdown.destroy();
      this.dropdown = null;
    });
  }

  /**
   * Event handler for the 'requestend' event on the dropdown 'component'.
   *
   *
   * @param event the standard jQuery event.
   * @param data any data passed by the dropdown (todo the type)
   *
   */
  private onRequestEnd(event: JQuery.TriggeredEvent, searchTerm: string, data: any[]) {
    // When the request for data has completed, make sure we
    // update the 'dropdown' control.
    this.ngZone.run(() => {
      this.ref.markForCheck();
    });

  }

  private onUpdated(event: JQuery.TriggeredEvent) {
    // Fire the event, in the angular zone.
    this.ngZone.run(() => this.updated$.next(event));
  }

  /**
   * Event handler for the 'changed' event on the 'dropdown' component.
   *
   *
   * @param event the standard jQuery event.
   *
   */
  private onChanged(event: any) {
    // Retrieve the value from the 'dropdown' component.
    const val = this.jQueryElement.val();

    this.ngZone.run(() => {
      // This value needs to be converted into an options value, which is
      // generated by the {SelectControlValueAccessor}.
      if (this.valueAccessor) {
        const optionValue = this.valueAccessor.convertToOptionValue(val);

        // Make sure calls to angular are made in the right zone.
        // ... update the model (which will fire change
        // detection if required).
        this.valueAccessor.onChangeFn(optionValue);
      }

      // @todo - this wants to be the real value, so we may need to look
      // that up.
      event.data = val;
      this.change$.emit(event);
    });
  }

  /**
   * Handles the 'listopened' event triggered by the underlying jQuery control.
   *
   * @param event the fired event.
   */
  private onListOpened(event: SohoDropDownEvent): void {
    this.ngZone.run(() => {
      this.listOpened$.emit(event);
    });
  }

  /**
   * Handles the 'listclosed' event triggered by the underlying jQuery control.
   *
   * @param event the fired event.
   */
  private onListClosed(event: SohoDropDownEvent, action: SohoDropDownEventActions): void {
    this.ngZone.run(() => {
      // Make sure the event is fixed up for dispatch
      event.action = action;
      this.listClosed$.emit(event);
    });
  }

  /**
   * In case options are being bound asynchronously, you will need to trigger updated on
   * soho dropdown control so it updates its value labels.
   */
  public updated(): SohoDropDownComponent {
    if (this.dropdown) {
      // Calling updated when an item is selected, loses the selection!
      this.ngZone.runOutsideAngular(() => this.dropdown.updated());
    }
    return this;
  }

  // -------------------------------------------
  // Component Input
  // -------------------------------------------

  @Input() set disabled(value: boolean) {
    if (this.dropdown) {
      if (value) {
        this.ngZone.runOutsideAngular(() => this.dropdown.disable());
      } else {
        this.ngZone.runOutsideAngular(() => this.dropdown.enable());
      }
    }
  }

  @Input() set readonly(value: boolean) {
    if (this.dropdown) {
      if (value) {
        this.ngZone.runOutsideAngular(() => this.dropdown.readonly());
      } else {
        this.ngZone.runOutsideAngular(() => this.dropdown.enable());
      }
    }
  }

  /**
   * @description
   *
   * Soho-dropdown is not a native element - need this to set focus programmatically.
   * 'name' attribute must be set on the control for this to work correctly.
   */
  public setFocus(): void {
    if (this.jQueryElement) {
      this.ngZone.runOutsideAngular(() => {
        this.jQueryElement.trigger('activated');
      });
    }
  }

  /**
   * @description
   *
   * Sets the value of the dropdown.
   *
   * @todo this may need to involve mapping from actual value
   * if ngModel is used.
   *
   * This is the model value that is to be set.
   * @param value - the internal value to select
   */
  public selectValue(value: any): void {
    if (this.dropdown) {
      this.ngZone.runOutsideAngular(() => {
        this.dropdown.selectValue(value);
      });
    }
  }

  /**
  * Marks the components as requiring a rebuild after the next update.
  */
  markForRefresh() {
    // Run updated on the next updated check.
    this.runUpdatedOnCheck = true;

    // ... make sure the change detector kicks in, otherwise if the inputs
    // were change programmatially the component may not be eligible for
    // updating.
    this.ref.markForCheck();
  }
}

/**
 * Provides a 'wrapper' around the {ControlValueAccessor} added by
 * angular when handling `select` elements.
 *
 * This class allows the {SohoDropDownComponent} to interoperate with
 * the {ControlValueAccessor}.  Specifically, providing access to the
 * onChange function, which we must call when the value of the dropdown
 * is modified.
 *
 * It also exposes the encoding used storing complex objects as
 * values in the 'option' elements.
 *
 * See https://github.com/angular/angular/blob/master/packages/forms/src/directives/select_multiple_control_value_accessor.ts.
 *
 *
 *
 */
class SohoDropDownControlValueAccessorDelegator implements ControlValueAccessor {
  /**
   * The Function to call when the value of the control changes.
   */
  public onChangeFn: Function;

  /**
   * Creates an instance of SohoDropDownControlValueAccessorDelegate.
   *
   * @param delegate the value accessor
   * @param dropdown the dropdown linked to the accessor
   *
   */
  constructor(
    private delegate: ControlValueAccessor,
    private dropdown: SohoDropDownComponent) { }

  writeValue(value: any): void {
    // Just pass it on.
    this.delegate.writeValue(value);

    // @todo reduce the number of calls to this!
    this.dropdown.markForRefresh();
  }

  registerOnChange(fn: any): void {
    // Keep a reference to the change function, then we an call it.
    this.onChangeFn = fn;

    // Give the delegate a chance to store this too.
    this.delegate.registerOnChange(fn);
  }

  registerOnTouched(fn: any): void {
    this.delegate.registerOnTouched(fn);
  }

  /**
   * Update the jQuery widget with the request disabled state.
   *
   * @param isDisabled true if the control should be disabled; otherwise false.
   *
   */
  setDisabledState(isDisabled: boolean): void {
    this.dropdown.disabled = isDisabled;
    this.delegate.setDisabledState(isDisabled);
  }

  /**
   * Convert the 'real' value into the corresponding
   * option value.
   *
   *
   * @param value the value of the option; must not be null.
   * @returns the string optipnValue of the otion elemen.
   *
   */
  convertToOptionValue(value: any): string {
    const delegate = (this.delegate as any);
    const id = delegate._getOptionId(value);
    return this.buildValueString(id, value);
  }

  /**
   * Copy of the "valuestring" builder used by the Angular
   * Select and MultiSelect
   * @param id option id (ordinal)
   * @param value the actual value
   */
  private buildValueString(id, value) {
    if (id == null) {
      return '' + value;
    }
    if (typeof value === 'string') {
      value = '\'' + value + '\'';
    }

    if (value && typeof value === 'object') {
      value = 'Object';
    }
    return (id + ': ' + value).slice(0, 50);
  }
}
