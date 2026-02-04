'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { frames } from '@/lib/frames';
import { Shoutout } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Camera, Heart, Code, CircuitBoard, Send, X, WandSparkles, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stylizeMessage } from '@/ai/flows/stylize-message-flow';
import { createWorker } from 'tesseract.js';

const formSchema = z.object({
  sender: z.string().min(1, 'Sender name is required.'),
  recipient: z.string().min(1, 'Recipient name is required.'),
  message: z.string().min(1, 'Message cannot be empty.').max(500, 'Message is too long.'),
  frame: z.string().min(1, 'Please select a frame.'),
});

type ShoutoutFormProps = {
  onAddShoutout: (shoutout: Omit<Shoutout, 'id' | 'createdAt'>) => void;
};

const frameIcons: { [key: string]: React.ReactNode } = {
  code: <Code className="w-8 h-8 text-primary" />,
  heart: <Heart className="w-8 h-8 text-primary" />,
  circuit: <CircuitBoard className="w-8 h-8 text-accent" />,
};

// Preprocess image for better OCR results
const preprocessImageForOCR = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale up for better OCR (but limit to reasonable size)
      const scale = Math.min(2, 2000 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Fill with white background first (helps with dark text on light background)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply simple contrast enhancement
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale and enhance contrast
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const contrast = 1.3; // Moderate contrast enhancement
          
          data[i] = Math.max(0, Math.min(255, (data[i] - avg) * contrast + avg));
          data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - avg) * contrast + avg));
          data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - avg) * contrast + avg));
        }

        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.warn('Could not apply image processing, using original');
      }

      // Convert to blob (JPEG for smaller size)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create blob from canvas'));
        }
      }, 'image/jpeg', 0.85);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Log image info for debugging
const logImageInfo = (file: File) => {
  const img = new window.Image();
  img.onload = function () {
    console.log('OCR Image Analysis:');
    console.log('- Dimensions:', img.width, 'x', img.height);
    console.log('- Format:', file.type);
    console.log('- Size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('- Aspect Ratio:', (img.width / img.height).toFixed(2));
  };
  img.onerror = () => console.log('Could not load image for analysis');
  img.src = URL.createObjectURL(file);
};

export default function ShoutoutForm({ onAddShoutout }: ShoutoutFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sender: 'Anonymous',
      recipient: '',
      message: '',
      frame: 'heart',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        // 1MB limit
        toast({
          title: 'Image too large',
          description: 'Please upload an image smaller than 1MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    const fileInput = document.getElementById('shoutout-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleStylize = async (style: 'poetic' | 'witty') => {
    const currentMessage = form.getValues('message');
    if (!currentMessage) {
      toast({
        title: 'Enter a message first!',
        description: 'You need to write a message before the AI can stylize it.',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(style);
    try {
      const result = await stylizeMessage({ message: currentMessage, style });
      if (result?.stylizedMessage) {
        form.setValue('message', result.stylizedMessage, { shouldValidate: true });
        toast({
          title: 'Message Stylized!',
          description: `Your message has been made more ${style}.`,
        });
      } else {
        throw new Error('No message returned');
      }
    } catch (error) {
      console.error('Failed to stylize message:', error);
      toast({
        title: 'AI Error',
        description: 'The AI failed to stylize your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleOcrScan = () => {
    ocrInputRef.current?.click();
  };

  const handleOcrImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Unsupported format',
        description: 'Please use JPEG, PNG, BMP, TIFF, or WebP images for OCR.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: 'Image too large',
        description: 'Please use an image smaller than 5MB for scanning.',
        variant: 'destructive',
      });
      return;
    }

    // Log image info for debugging
    if (debugMode) {
      logImageInfo(file);
    }

    setOcrLoading(true);
    setOcrStatus('Initializing scanner...');

    try {
      // Preprocess image
      setOcrStatus('Processing image...');
      const processedBlob = await preprocessImageForOCR(file);

      // Initialize Tesseract worker
      const worker = await createWorker({
        logger: (m) => {
          if (debugMode) {
            console.log('Tesseract:', m);
          }
          if (m.status === 'recognizing text') {
            const progress = (m.progress * 100).toFixed(0);
            setOcrStatus(`Scanning: ${progress}%`);
          } else if (m.status === 'loading tesseract core') {
            setOcrStatus('Loading scanner engine...');
          } else if (m.status === 'loading language model') {
            setOcrStatus('Loading language model...');
          }
        },
        errorHandler: (err) => {
          console.error('Tesseract worker error:', err);
          setOcrStatus('Error in scanner');
        },
      });

      // Load and initialize language
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Configure OCR settings
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        tessedit_ocr_engine_mode: '1', // LSTM only
        preserve_interword_spaces: '1',
        textord_min_linesize: '2.5',
        tessjs_create_hocr: '0', // Don't create hOCR
        tessjs_create_tsv: '0', // Don't create TSV
        tessjs_create_box: '0', // Don't create box file
      });

      // Perform OCR
      setOcrStatus('Recognizing text...');
      const {
        data: { text },
      } = await worker.recognize(processedBlob);

      // Clean and validate the extracted text
      const cleanedText = text
        .replace(/\s+/g, ' ') // Replace multiple spaces/newlines
        .replace(/[^\S\r\n]+/g, ' ') // Normalize whitespace
        .trim();

      if (debugMode) {
        console.log('Raw OCR text:', text);
        console.log('Cleaned text:', cleanedText);
        console.log('Text length:', cleanedText.length);
      }

      if (cleanedText && cleanedText.length >= 3) {
        // Minimum 3 characters
        const currentMessage = form.getValues('message');
        const separator = currentMessage && !currentMessage.endsWith('\n') ? '\n' : '';
        const newMessage = currentMessage
          ? `${currentMessage}${separator}${cleanedText}`
          : cleanedText;
        
        form.setValue('message', newMessage, { shouldValidate: true });
        
        toast({
          title: 'Text Scanned Successfully!',
          description: `Added ${cleanedText.length} characters from your image.`,
        });
      } else {
        toast({
          title: 'No Text Found',
          description: 'Could not find readable text. Try a clearer image with printed text.',
          variant: 'destructive',
        });
      }

      // Terminate worker
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      
      let errorMessage = 'Failed to scan image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('WorkerPool')) {
          errorMessage = 'OCR engine failed to load. Please refresh and try again.';
        } else if (error.message.includes('memory')) {
          errorMessage = 'Image too large. Try a smaller image.';
        }
      }

      toast({
        title: 'Scan Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setOcrLoading(false);
      setOcrStatus(null);
      
      // Reset file input
      if (e.target) e.target.value = '';
    }
  };

  const testOCRWithSample = async () => {
    // Test with a known good OCR sample image
    const sampleImageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png';
    
    setOcrLoading(true);
    setOcrStatus('Loading test image...');

    try {
      const response = await fetch(sampleImageUrl);
      if (!response.ok) throw new Error('Failed to fetch test image');
      
      const blob = await response.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      // Create a mock event object
      const mockEvent = {
        target: {
          files: [file],
        },
      } as React.ChangeEvent<HTMLInputElement>;

      await handleOcrImageChange(mockEvent);
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: 'Could not load test image. Check your connection.',
        variant: 'destructive',
      });
      setOcrLoading(false);
      setOcrStatus(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      onAddShoutout({
        sender: values.sender,
        recipient: values.recipient,
        message: values.message,
        image: imageBase64,
        frame: values.frame,
      });

      toast({
        title: 'Shoutout Sent!',
        description: 'Your message is now live on the feed.',
      });

      form.reset();
      clearImage();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl">Create a Shoutout</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
            className={cn("text-xs", debugMode && "bg-accent/20")}
          >
            <TestTube className="h-3 w-3 mr-2" />
            {debugMode ? 'Debug On' : 'Debug Off'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name / Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="Anonymous" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input placeholder="My fellow Coder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Your Message</FormLabel>
                    <div className="flex gap-2">
                      {debugMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={testOCRWithSample}
                          disabled={ocrLoading}
                          className="text-xs"
                        >
                          Test OCR
                          <TestTube className="ml-2 h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOcrScan}
                        disabled={ocrLoading}
                        className="text-xs"
                      >
                        {ocrLoading ? ocrStatus || 'Scanning...' : 'Scan from Note'}
                        <Camera className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Type your Valentine's message here, or scan it from a note!"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStylize('poetic')}
                      disabled={!!aiLoading || ocrLoading}
                      className="text-xs"
                    >
                      {aiLoading === 'poetic' ? 'Stylizing...' : 'Make it Poetic'}
                      <WandSparkles className="ml-2 h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStylize('witty')}
                      disabled={!!aiLoading || ocrLoading}
                      className="text-xs"
                    >
                      {aiLoading === 'witty' ? 'Stylizing...' : 'Make it Witty'}
                      <WandSparkles className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                  {debugMode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Character count: {field.value?.length || 0}/500
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormControl>
              <Input
                ref={ocrInputRef}
                id="ocr-image-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOcrImageChange}
                className="hidden"
              />
            </FormControl>

            <FormItem>
              <FormLabel>Upload Image (Optional)</FormLabel>
              <FormControl>
                <Input
                  id="shoutout-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:text-primary"
                />
              </FormControl>
              {imagePreview && (
                <div className="relative mt-4 w-full h-48 rounded-md overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Image preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </FormItem>

            <FormField
              control={form.control}
              name="frame"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose a Frame</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      {frames.map((frame) => (
                        <FormItem key={frame.id}>
                          <FormControl>
                            <RadioGroupItem value={frame.id} className="sr-only" />
                          </FormControl>
                          <FormLabel
                            className={cn(
                              'frame-radio',
                              frame.className,
                              'flex flex-col items-center justify-center p-4 rounded-lg border-2 border-transparent hover:border-primary cursor-pointer transition-all',
                              field.value === frame.id && 'border-primary bg-primary/5'
                            )}
                          >
                            {frameIcons[frame.id]}
                            <span className="mt-2 text-sm font-medium">{frame.name}</span>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || ocrLoading}
            >
              {isSubmitting ? 'Sending...' : 'Send Shoutout'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
        
        {debugMode && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-medium text-sm mb-2">OCR Debug Info:</h4>
            <p className="text-xs text-muted-foreground">
              • Use clear, printed text for best results<br/>
              • Ensure good lighting and contrast<br/>
              • Test with the "Test OCR" button first<br/>
              • Handwritten text may have lower accuracy
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
