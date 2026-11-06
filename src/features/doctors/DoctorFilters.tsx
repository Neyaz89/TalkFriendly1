"use client";

import { useState } from "react";
import type { DoctorFilterParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  X, 
  Star,
  DollarSign,
  CheckCircle
} from "lucide-react";

interface DoctorFiltersProps {
  currentFilters: DoctorFilterParams;
  onFilterChange: (filters: Partial<DoctorFilterParams>) => void;
}

const SPECIALIZATIONS = [
  'Anxiety',
  'Depression',
  'Stress Management',
  'PTSD',
  'Relationship Issues',
  'Family Therapy',
  'Cognitive Behavioral Therapy',
  'Mindfulness',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Arabic',
];

export function DoctorFilters({ currentFilters, onFilterChange }: DoctorFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(currentFilters.specialization || []);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(currentFilters.languages || []);
  const [minRating, setMinRating] = useState<number>(currentFilters.min_rating || 0);
  const [acceptsPatients, setAcceptsPatients] = useState<boolean | undefined>(currentFilters.accepts_patients);

  const hasActiveFilters = 
    selectedSpecs.length > 0 ||
    selectedLangs.length > 0 ||
    minRating > 0 ||
    acceptsPatients !== undefined;

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const applyFilters = () => {
    onFilterChange({
      specialization: selectedSpecs.length > 0 ? selectedSpecs : undefined,
      languages: selectedLangs.length > 0 ? selectedLangs : undefined,
      min_rating: minRating > 0 ? minRating : undefined,
      accepts_patients: acceptsPatients,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedSpecs([]);
    setSelectedLangs([]);
    setMinRating(0);
    setAcceptsPatients(undefined);
    onFilterChange({
      specialization: undefined,
      languages: undefined,
      min_rating: undefined,
      accepts_patients: undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Filter Toggle */}
      <div className="p-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge variant="primary" className="text-xs">
              {[selectedSpecs.length, selectedLangs.length, minRating > 0 ? 1 : 0].filter(Boolean).reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600 dark:text-gray-400"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="px-4 pb-4 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Specializations */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Specialization
            </h3>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(spec => (
                <button
                  key={spec}
                  onClick={() => toggleSpec(spec)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${selectedSpecs.includes(spec)
                      ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => toggleLang(lang)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${selectedLangs.includes(lang)
                      ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Minimum Rating
            </h3>
            <div className="flex items-center gap-2">
              {[0, 3, 4, 4.5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                    ${minRating === rating
                      ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {rating === 0 ? (
                    'Any'
                  ) : (
                    <>
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{rating}+</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Accepting New Patients */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Availability
            </h3>
            <button
              onClick={() => setAcceptsPatients(prev => prev === true ? undefined : true)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                ${acceptsPatients === true
                  ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                }
              `}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Accepting new patients</span>
            </button>
          </div>

          {/* Apply Button */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
