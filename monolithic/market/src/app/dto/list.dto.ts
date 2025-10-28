export class ListDto<T> {
  objects: T[];
  total: number;
  totalpages: number;

  constructor(objects: T[], total: number, onPage: number) {
    this.objects = objects ?? [];
    this.total = total ?? 0;
    this.totalpages = Math.ceil(this.total / onPage) ?? 0;
  }
}
