'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

const variantConfig = {
  default: {
    icon: CheckCircle,
    iconColor: 'text-primary',
    confirmVariant: 'default' as const,
  },
  destructive: {
    icon: XCircle,
    iconColor: 'text-destructive',
    confirmVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    confirmVariant: 'destructive' as const,
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmVariant: 'default' as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <div className="flex items-center space-x-3">
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
            <ModalTitle>{title}</ModalTitle>
          </div>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <div className="flex justify-end space-x-2 p-4">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={config.confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showConfirm = React.useCallback((options: Omit<typeof dialogState, 'open'>) => {
    setDialogState({ ...options, open: true });
  }, []);

  const hideConfirm = React.useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      {...dialogState}
      onOpenChange={hideConfirm}
    />
  ), [dialogState, hideConfirm]);

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}