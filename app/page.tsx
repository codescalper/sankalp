"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Check, RotateCcw, Target, Flame } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// TypeScript interfaces
interface SankalpDay {
  date: Date;
  day: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  dateString: string;
  dayName: string;
}

interface StoredSankalpDay {
  date: string;
  day: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  dateString: string;
  dayName: string;
}

interface StoredSankalpData {
  totalDays: number;
  completedDays: number[];
  sankalpDays: StoredSankalpDay[];
  startDate: string;
  sankalpStarted: boolean;
  version: number;
}

interface ValidationError {
  field: string;
  message: string;
}

const SankalpTracker: React.FC = () => {
  const [days, setDays] = useState<string>('');
  const [sankalpStarted, setSankalpStarted] = useState<boolean>(false);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [sankalpDays, setSankalpDays] = useState<SankalpDay[]>([]);
  const [totalDays, setTotalDays] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const STORAGE_KEY = 'hanuman-chalisa-sankalp';
  const STORAGE_VERSION = 1;
  const MAX_SANKALP_DAYS = 365;
  const MIN_SANKALP_DAYS = 1;

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadFromStorage = async (): Promise<void> => {
      try {
        // Note: This will work in your Next.js environment but not in Claude.ai artifacts
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return;

        const data = JSON.parse(savedData);
        
        // Validate data structure
        if (!validateSankalpData(data)) {
          console.warn('Invalid sankalp data found, clearing storage');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Check if sankalp is still valid (not expired)
        const startDate = new Date(data.startDate);
        
        if (!isValidDate(startDate)) {
          console.warn('Invalid start date found, clearing storage');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Recreate dates from saved data with proper validation
        const reconstructedDays = data.sankalpDays
          .map((day: StoredSankalpDay) => {
            const date = new Date(day.date);
            if (!isValidDate(date)) return null;
            
            return {
              ...day,
              date: date,
              isToday: isToday(date),
              isPast: isPast(date),
              isFuture: isFuture(date)
            } as SankalpDay;
          })
          .filter(Boolean) as SankalpDay[];

        // Only load if we have valid days
        if (reconstructedDays.length === data.totalDays) {
          setSankalpStarted(data.sankalpStarted);
          setCompletedDays(new Set(data.completedDays.filter((day: number) => 
            typeof day === 'number' && day >= 1 && day <= data.totalDays
          )));
          setSankalpDays(reconstructedDays);
          setTotalDays(data.totalDays);
        } else {
          console.warn('Sankalp data corruption detected, clearing storage');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Clear corrupted data
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (clearError) {
          console.error('Error clearing corrupted localStorage:', clearError);
        }
      }
    };

    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await loadFromStorage();
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const saveToStorage = (): void => {
      try {
        const dataToSave: StoredSankalpData = {
          totalDays,
          completedDays: Array.from(completedDays),
          sankalpDays: sankalpDays.map(day => ({
            ...day,
            date: day.date.toISOString()
          })),
          startDate: sankalpDays[0]?.date.toISOString() || '',
          sankalpStarted,
          version: STORAGE_VERSION
        };
        
        // Validate data before saving
        if (!validateSankalpData(dataToSave)) {
          console.error('Invalid data structure, not saving to localStorage');
          return;
        }
        
        // Note: This will work in your Next.js environment but not in Claude.ai artifacts
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    };

    if (sankalpStarted && !isLoading) {
      saveToStorage();
    }
  }, [sankalpStarted, completedDays, sankalpDays, totalDays, isLoading]);

  // Validation functions
  const validateDaysInput = (input: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!input || input.trim() === '') {
      errors.push({ field: 'days', message: 'कृपया दिनों की संख्या दर्ज करें' });
      return errors;
    }

    const numDays = parseInt(input);
    
    if (isNaN(numDays)) {
      errors.push({ field: 'days', message: 'कृपया वैध संख्या दर्ज करें' });
      return errors;
    }

    if (numDays < MIN_SANKALP_DAYS) {
      errors.push({ field: 'days', message: `संकल्प कम से कम ${MIN_SANKALP_DAYS} दिन का होना चाहिए` });
    }

    if (numDays > MAX_SANKALP_DAYS) {
      errors.push({ field: 'days', message: `संकल्प अधिकतम ${MAX_SANKALP_DAYS} दिन का हो सकता है` });
    }

    return errors;
  };

  const validateSankalpData = (data: unknown): data is StoredSankalpData => {
    if (!data || typeof data !== 'object' || data === null) {
      return false;
    }
    
    const obj = data as Record<string, unknown>;
    
    return (
      typeof obj.totalDays === 'number' &&
      Array.isArray(obj.completedDays) &&
      Array.isArray(obj.sankalpDays) &&
      typeof obj.startDate === 'string' &&
      typeof obj.sankalpStarted === 'boolean' &&
      obj.version === STORAGE_VERSION
    );
  };

  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const generateSankalpDays = (numDays: number): SankalpDay[] => {
    const days: SankalpDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (!isValidDate(date)) {
        console.error(`Invalid date generated for day ${i + 1}`);
        continue;
      }
      
      days.push({
        date: date,
        day: i + 1,
        isToday: isToday(date),
        isPast: isPast(date),
        isFuture: isFuture(date),
        dateString: date.toLocaleDateString('hi-IN'),
        dayName: date.toLocaleDateString('hi-IN', { weekday: 'long' })
      });
    }
    return days;
  };

  const startSankalp = (): void => {
    const errors = validateDaysInput(days);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }

    const numDays: number = parseInt(days);
    
    try {
      const generatedDays = generateSankalpDays(numDays);
      
      if (generatedDays.length !== numDays) {
        setValidationErrors([{ field: 'days', message: 'दिनों की गणना में त्रुटि हुई है' }]);
        return;
      }

      setTotalDays(numDays);
      setSankalpDays(generatedDays);
      setSankalpStarted(true);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error starting sankalp:', error);
      setValidationErrors([{ field: 'days', message: 'संकल्प शुरू करने में त्रुटि हुई है' }]);
    }
  };

  const toggleDay = (dayNumber: number): void => {
    // Validate day number
    if (dayNumber < 1 || dayNumber > totalDays) {
      console.error(`Invalid day number: ${dayNumber}`);
      return;
    }

    // Find the day to check if it's in the future
    const dayToToggle = sankalpDays.find(day => day.day === dayNumber);
    if (!dayToToggle) {
      console.error(`Day ${dayNumber} not found in sankalp days`);
      return;
    }

    // Allow only today and past days to be marked as completed
    // Future days can only be unmarked if they were previously marked
    if (dayToToggle.isFuture && !completedDays.has(dayNumber)) {
      console.warn(`Cannot mark future day ${dayNumber} as completed`);
      return;
    }

    const newCompleted = new Set(completedDays);
    if (newCompleted.has(dayNumber)) {
      newCompleted.delete(dayNumber);
    } else {
      newCompleted.add(dayNumber);
    }
    setCompletedDays(newCompleted);
  };

  const resetSankalp = (): void => {
    try {
      setSankalpStarted(false);
      setCompletedDays(new Set());
      setSankalpDays([]);
      setDays('');
      setTotalDays(0);
      setValidationErrors([]);
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting sankalp:', error);
    }
  };

  const completionPercentage: number = totalDays > 0 ? Math.round((completedDays.size / totalDays) * 100) : 0;

  const handleDaysInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setDays(value);
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const setQuickDays = (numDays: number): void => {
    setDays(numDays.toString());
    // Clear validation errors when using quick select
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🚩</div>
          <p className="text-orange-600" style={{ fontFamily: 'Devanagari, serif' }}>
            लोड हो रहा है...
          </p>
        </div>
      </div>
    );
  }

  if (!sankalpStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚩</div>
            <h1 className="text-4xl font-bold text-orange-800 mb-2" style={{ fontFamily: 'Devanagari, serif' }}>
              राम राम
            </h1>
            <h2 className="text-2xl font-semibold text-red-700 mb-2" style={{ fontFamily: 'Devanagari, serif' }}>
              हनुमान चालीसा संकल्प ट्रैकर
            </h2>
            <p className="text-orange-600 text-sm" style={{ fontFamily: 'Devanagari, serif' }}>
              अपने संकल्प की शुरुआत करें
            </p>
          </div>

          <Card className="shadow-xl border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-orange-800 flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                संकल्प निर्धारण
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-2" style={{ fontFamily: 'Devanagari, serif' }}>
                  कितने दिन का संकल्प लेना चाहते हैं?
                </label>
                <Input
                  type="number"
                  value={days}
                  onChange={handleDaysInputChange}
                  placeholder="जैसे: 11, 21, 40, 108"
                  className={`text-center text-lg font-semibold border-orange-300 focus:border-orange-500 ${
                    validationErrors.some(err => err.field === 'days') 
                      ? 'border-red-500 focus:border-red-500' 
                      : ''
                  }`}
                  min={MIN_SANKALP_DAYS}
                  max={MAX_SANKALP_DAYS}
                />
                {validationErrors.map((error, index) => (
                  <Alert key={index} className="mt-2 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm" style={{ fontFamily: 'Devanagari, serif' }}>
                      {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[11, 21, 40, 108].map((num: number) => (
                  <Button
                    key={num}
                    variant="outline"
                    onClick={() => setQuickDays(num)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    {num} दिन
                  </Button>
                ))}
              </div>

              <Button
                onClick={startSankalp}
                disabled={!days || validationErrors.length > 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Flame className="w-5 h-5 mr-2" />
                संकल्प शुरू करें
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="text-2xl mb-2">🙏</div>
            <p className="text-orange-600 text-sm" style={{ fontFamily: 'Devanagari, serif' }}>
              जय हनुमान ज्ञान गुण सागर
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-3xl">🚩</div>
            <h1 className="text-3xl font-bold text-orange-800" style={{ fontFamily: 'Devanagari, serif' }}>
              हनुमान चालीसा संकल्प
            </h1>
            <div className="text-3xl">🚩</div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 px-4 py-2">
              <Calendar className="w-4 h-4 mr-2" />
              {totalDays} दिन का संकल्प
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-4 py-2">
              <Check className="w-4 h-4 mr-2" />
              {completedDays.size} पूर्ण
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex justify-between text-sm text-orange-700 mb-1">
              <span>प्रगति</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <RotateCcw className="w-4 h-4 mr-2" />
                रीसेट करें
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center" style={{ fontFamily: 'Devanagari, serif' }}>
                  क्या आप वाकई रीसेट करना चाहते हैं?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center" style={{ fontFamily: 'Devanagari, serif' }}>
                  यह आपकी सभी प्रगति को मिटा देगा। यह कार्रवाई को पूर्ववत नहीं किया जा सकता।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>रद्द करें</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={resetSankalp}
                  className="bg-red-600 hover:bg-red-700"
                >
                  हां, रीसेट करें
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sankalpDays.map((day: SankalpDay) => {
            const isCompleted: boolean = completedDays.has(day.day);
            const isTodayDay: boolean = day.isToday;
            const isPastDay: boolean = day.isPast;
            const isFutureDay: boolean = day.isFuture;
            
            return (
              <Card 
                key={day.day}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-400 shadow-lg' 
                    : isTodayDay
                    ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-400 shadow-lg ring-2 ring-orange-300'
                    : isPastDay
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md'
                    : isFutureDay
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm opacity-75'
                    : 'bg-white/80 backdrop-blur-sm border-orange-200 hover:border-orange-300'
                }`}
                onClick={() => toggleDay(day.day)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isFutureDay ? 'text-blue-600' : 'text-orange-700'
                      }`}>
                        दिन {day.day}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isFutureDay
                          ? 'bg-blue-200 text-blue-700 border-2 border-blue-300'
                          : 'bg-orange-200 text-orange-700 border-2 border-orange-300'
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : day.day}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div style={{ fontFamily: 'Devanagari, serif' }}>
                        {day.dayName}
                      </div>
                      <div className="font-mono">
                        {day.dateString}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      {isTodayDay && (
                        <Badge className="text-xs bg-orange-500 text-white">
                          आज
                        </Badge>
                      )}
                      {isPastDay && !isTodayDay && (
                        <Badge className="text-xs bg-red-500 text-white">
                          बीता हुआ
                        </Badge>
                      )}
                      {isFutureDay && (
                        <Badge className="text-xs bg-blue-500 text-white">
                          आने वाला
                        </Badge>
                      )}
                    </div>

                    {isFutureDay && !isCompleted && (
                      <p className="text-xs text-blue-600 mt-1" style={{ fontFamily: 'Devanagari, serif' }}>
                        अभी तक नहीं आया
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Motivational Message */}
        <div className="mt-8 text-center">
          <div className="text-4xl mb-2">🙏</div>
          <p className="text-orange-700 font-medium" style={{ fontFamily: 'Devanagari, serif' }}>
            हनुमान जी आपकी मनोकामना पूर्ण करें
          </p>
          <p className="text-orange-600 text-sm mt-2" style={{ fontFamily: 'Devanagari, serif' }}>
            निरंतर अभ्यास से ही सिद्धि मिलती है
          </p>
        </div>
      </div>
    </div>
  );
};

export default SankalpTracker;