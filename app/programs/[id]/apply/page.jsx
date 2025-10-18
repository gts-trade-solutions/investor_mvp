'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Upload, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Tell us about your startup' },
  { id: 2, title: 'Team & Founders', description: 'Information about your team' },
  { id: 3, title: 'Product & Market', description: 'Your product and target market' },
  { id: 4, title: 'Traction & Metrics', description: 'Current progress and metrics' },
  { id: 5, title: 'Documents & Submission', description: 'Upload required documents' }
]

export default function ProgramApplication({ params }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    companyName: '',
    website: '',
    foundedDate: '',
    location: '',
    sector: '',
    stage: '',
    description: '',
    
    // Step 2: Team & Founders
    founders: [{ name: '', email: '', role: '', linkedin: '' }],
    teamSize: '',
    
    // Step 3: Product & Market
    productDescription: '',
    targetMarket: '',
    businessModel: '',
    competitors: '',
    
    // Step 4: Traction & Metrics
    revenue: '',
    customers: '',
    growth: '',
    funding: '',
    
    // Step 5: Documents
    pitchDeck: null,
    businessPlan: null,
    financials: null,
    
    // Legal
    termsAccepted: false,
    privacyAccepted: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFounder = () => {
    setFormData(prev => ({
      ...prev,
      founders: [...prev.founders, { name: '', email: '', role: '', linkedin: '' }]
    }))
  }

  const updateFounder = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      founders: prev.founders.map((founder, i) => 
        i === index ? { ...founder, [field]: value } : founder
      )
    }))
  }

  const removeFounder = (index) => {
    if (formData.founders.length > 1) {
      setFormData(prev => ({
        ...prev,
        founders: prev.founders.filter((_, i) => i !== index)
      }))
    }
  }

  const handleFileUpload = (field, file) => {
    if (file && file.type === 'application/pdf' && file.size <= 25 * 1024 * 1024) {
      updateFormData(field, file)
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file smaller than 25MB.',
        variant: 'destructive'
      })
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast({
        title: 'Please accept terms',
        description: 'You must accept the terms and privacy policy to submit.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: Submit application to API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Application submitted!',
        description: 'We will review your application and get back to you within 2 weeks.'
      })
      
      // Redirect to success page or program detail
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  placeholder="Your startup name"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="foundedDate">Founded Date *</Label>
                <Input
                  id="foundedDate"
                  type="date"
                  value={formData.foundedDate}
                  onChange={(e) => updateFormData('foundedDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <Label htmlFor="sector">Sector *</Label>
                <Select value={formData.sector} onValueChange={(value) => updateFormData('sector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="healthtech">Healthtech</SelectItem>
                    <SelectItem value="edtech">Edtech</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="stage">Current Stage *</Label>
              <Select value={formData.stage} onValueChange={(value) => updateFormData('stage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="mvp">MVP</SelectItem>
                  <SelectItem value="pre_seed">Pre-seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Company Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe what your company does in 2-3 sentences"
                rows={4}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Founders *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFounder}>
                  Add Founder
                </Button>
              </div>
              
              {formData.founders.map((founder, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Founder {index + 1}</h4>
                    {formData.founders.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFounder(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input
                        value={founder.name}
                        onChange={(e) => updateFounder(index, 'name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={founder.email}
                        onChange={(e) => updateFounder(index, 'email', e.target.value)}
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Input
                        value={founder.role}
                        onChange={(e) => updateFounder(index, 'role', e.target.value)}
                        placeholder="CEO, CTO, etc."
                      />
                    </div>
                    <div>
                      <Label>LinkedIn</Label>
                      <Input
                        value={founder.linkedin}
                        onChange={(e) => updateFounder(index, 'linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div>
              <Label htmlFor="teamSize">Total Team Size *</Label>
              <Select value={formData.teamSize} onValueChange={(value) => updateFormData('teamSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 people</SelectItem>
                  <SelectItem value="3-5">3-5 people</SelectItem>
                  <SelectItem value="6-10">6-10 people</SelectItem>
                  <SelectItem value="11-20">11-20 people</SelectItem>
                  <SelectItem value="20+">20+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="productDescription">Product Description *</Label>
              <Textarea
                id="productDescription"
                value={formData.productDescription}
                onChange={(e) => updateFormData('productDescription', e.target.value)}
                placeholder="Describe your product or service in detail"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="targetMarket">Target Market *</Label>
              <Textarea
                id="targetMarket"
                value={formData.targetMarket}
                onChange={(e) => updateFormData('targetMarket', e.target.value)}
                placeholder="Who are your customers? What problem do you solve for them?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="businessModel">Business Model *</Label>
              <Textarea
                id="businessModel"
                value={formData.businessModel}
                onChange={(e) => updateFormData('businessModel', e.target.value)}
                placeholder="How do you make money? What's your pricing strategy?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="competitors">Competition</Label>
              <Textarea
                id="competitors"
                value={formData.competitors}
                onChange={(e) => updateFormData('competitors', e.target.value)}
                placeholder="Who are your main competitors? What's your competitive advantage?"
                rows={3}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="revenue">Monthly Revenue</Label>
                <Input
                  id="revenue"
                  value={formData.revenue}
                  onChange={(e) => updateFormData('revenue', e.target.value)}
                  placeholder="$0 or $5,000"
                />
              </div>
              <div>
                <Label htmlFor="customers">Number of Customers</Label>
                <Input
                  id="customers"
                  value={formData.customers}
                  onChange={(e) => updateFormData('customers', e.target.value)}
                  placeholder="0 or 100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="growth">Growth Metrics</Label>
              <Textarea
                id="growth"
                value={formData.growth}
                onChange={(e) => updateFormData('growth', e.target.value)}
                placeholder="Describe your growth metrics (user growth, revenue growth, etc.)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="funding">Previous Funding</Label>
              <Textarea
                id="funding"
                value={formData.funding}
                onChange={(e) => updateFormData('funding', e.target.value)}
                placeholder="Have you raised funding before? If so, how much and from whom?"
                rows={3}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Pitch Deck (PDF) *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('pitchDeck', e.target.files[0])}
                    className="hidden"
                    id="pitchDeck"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('pitchDeck').click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.pitchDeck ? formData.pitchDeck.name : 'Upload Pitch Deck'}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Business Plan (PDF)</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('businessPlan', e.target.files[0])}
                    className="hidden"
                    id="businessPlan"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('businessPlan').click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.businessPlan ? formData.businessPlan.name : 'Upload Business Plan (Optional)'}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Financial Projections (PDF)</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('financials', e.target.files[0])}
                    className="hidden"
                    id="financials"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('financials').click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.financials ? formData.financials.name : 'Upload Financials (Optional)'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => updateFormData('termsAccepted', checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onCheckedChange={(checked) => updateFormData('privacyAccepted', checked)}
                />
                <Label htmlFor="privacy" className="text-sm">
                  I accept the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/programs/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Program
            </Link>
            <h1 className="text-3xl font-bold">Program Application</h1>
            <p className="text-muted-foreground">Complete all steps to submit your application</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round((currentStep / STEPS.length) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / STEPS.length) * 100} className="mb-4" />
            
            <div className="flex items-center justify-between">
              {STEPS.map((step) => (
                <div key={step.id} className={`flex-1 text-center ${step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {step.id}
                  </div>
                  <p className="text-xs font-medium">{step.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}