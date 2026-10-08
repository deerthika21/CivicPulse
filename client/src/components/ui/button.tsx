import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-[3px] focus-visible:ring-ring/30",
  {
    variants: {
      variant: {
        default: 'bg-brand-gradient text-white shadow-brand hover:brightness-110 hover:shadow-[0_10px_28px_-8px_rgb(79_70_229/0.55)]',
        teal: 'bg-teal-brand text-white shadow-sm hover:brightness-110',
        destructive: 'bg-destructive text-white shadow-sm hover:brightness-110',
        outline: 'border border-border bg-card text-foreground shadow-soft hover:border-slate-300 hover:bg-slate-50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200/70',
        ghost: 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
        glass: 'border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 rounded-2xl px-7 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
