export class UsecaseError<U> {
  constructor(
    public code: U,
    public message?: string
  ) {}
}