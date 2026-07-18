'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { completeOnboarding,updateOnboardingProfile, uploadOnboardingPhoto } from '@/actions/onboarding.actions';
import { PhotoUploader } from '@/app/[locale]/(private)/settings/photo-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { toast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 3;

export const OnboardingWizard = () => {
  const t = useTranslations('private.onboarding');
  const router = useRouter();
  const { errorToast } = useServerErrorToast();
  const [step, setStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const academicSchema = z.object({
    faculty: z.string().min(1, { message: t('validation.faculty-required') }),
    speciality: z.string().min(1, { message: t('validation.speciality-required') }),
    groupName: z.string().min(1, { message: t('validation.group-required') }),
    studyForm: z.string().min(1, { message: t('validation.study-form-required') }),
    studyYear: z.string().min(1, { message: t('validation.study-year-required') }).refine(
      (val) => { const n = Number(val); return n >= 1 && n <= 6; },
      { message: t('validation.study-year-max') },
    ),
  });

  const personalSchema = z.object({
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    gradeBookNumber: z.string().optional(),
  });

  type AcademicFormData = z.infer<typeof academicSchema>;
  type PersonalFormData = z.infer<typeof personalSchema>;

  const academicForm = useForm({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      faculty: '',
      speciality: '',
      groupName: '',
      studyForm: '',
      studyYear: '1',
    } as AcademicFormData,
  });

  const personalForm = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      phone: '',
      birthDate: '',
      gradeBookNumber: '',
    } as PersonalFormData,
  });

  const handleNext = async () => {
    if (step === 0) {
      const valid = await academicForm.trigger();
      if (!valid) return;
    }
    if (step === 1) {
      const valid = await personalForm.trigger();
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSkip = () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleFinish = async () => {
    try {
      const academicData = academicForm.getValues();
      const personalData = personalForm.getValues();

      await updateOnboardingProfile({
        faculty: academicData.faculty,
        speciality: academicData.speciality,
        groupName: academicData.groupName,
        studyForm: academicData.studyForm,
        studyYear: Number(academicData.studyYear),
        phone: personalData.phone,
        birthDate: personalData.birthDate,
        gradeBookNumber: personalData.gradeBookNumber,
      });

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile, photoFile.name);
        await uploadOnboardingPhoto(formData);
      }

      await completeOnboarding();

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      router.push('/');
    } catch {
      errorToast();
    }
  };

  const handleSkipAll = async () => {
    try {
      await completeOnboarding();
      router.push('/');
    } catch {
      errorToast();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all',
                i === step ? 'bg-basic-blue w-8' : i < step ? 'bg-status-success-300 w-2' : 'bg-border w-2',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleSkipAll}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('skip-all')}
        </button>
      </div>

      <Card>
        <CardContent className="p-6 md:p-10">
          {step === 0 && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">{t('steps.academic.title')}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t('steps.academic.description')}</p>
              <Form {...academicForm}>
                <div className="space-y-4">
                  <FormField
                    control={academicForm.control}
                    name="faculty"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.faculty')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('placeholder.faculty')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={academicForm.control}
                    name="speciality"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.speciality')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('placeholder.speciality')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={academicForm.control}
                      name="groupName"
                      render={({ field }) => (
                        <FormItem className="grid w-full gap-2">
                          <FormLabel>{t('field.group')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('placeholder.group')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={academicForm.control}
                      name="studyForm"
                      render={({ field }) => (
                        <FormItem className="grid w-full gap-2">
                          <FormLabel>{t('field.study-form')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('placeholder.study-form')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={academicForm.control}
                    name="studyYear"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.study-year')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={1} max={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">{t('steps.personal.title')}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t('steps.personal.description')}</p>
              <Form {...personalForm}>
                <div className="space-y-4">
                  <FormField
                    control={personalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('placeholder.phone')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.birth-date')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="gradeBookNumber"
                    render={({ field }) => (
                      <FormItem className="grid w-full gap-2">
                        <FormLabel>{t('field.grade-book')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('placeholder.grade-book')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">{t('steps.photo.title')}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t('steps.photo.description')}</p>
              <PhotoUploader photoSrc="" onFileUpload={setPhotoFile} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="tertiary"
              size="medium"
              onClick={handleBack}
              disabled={step === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t('button.back')}
            </Button>

            <div className="flex gap-2">
              {step < TOTAL_STEPS - 1 && (
                <Button variant="tertiary" size="medium" onClick={handleSkip}>
                  {t('button.skip')}
                </Button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <Button size="medium" onClick={handleNext}>
                  {t('button.next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button size="medium" onClick={handleFinish}>
                  <Check className="mr-1 h-4 w-4" />
                  {t('button.finish')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
