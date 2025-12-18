
import React from 'react';
import { Check, Clock, X, Plane, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Ensure this component exists
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkflowTrackerProps {
    deployment: any; // Ideally typed
    onUpdate: (data: any) => void;
}

export function WorkflowTracker({ deployment, onUpdate }: WorkflowTrackerProps) {

    const handleUpdate = (field: string, value: any) => {
        onUpdate({
            ...deployment,
            [field]: value
        });
    };

    const steps = [
        {
            id: 'health_check',
            title: 'Overseas Health Check',
            icon: <CheckCircle2 className="w-5 h-5" />,
            status: deployment.overseasCheckStatus, // pending, passed, failed
            date: deployment.overseasCheckDate,
            action: (
                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={deployment.overseasCheckStatus === 'passed' ? 'default' : 'outline'}
                            className={cn(deployment.overseasCheckStatus === 'passed' && "bg-green-600 hover:bg-green-700")}
                            onClick={() => handleUpdate('overseasCheckStatus', 'passed')}
                        >
                            Pass
                        </Button>
                        <Button
                            size="sm"
                            variant={deployment.overseasCheckStatus === 'failed' ? 'destructive' : 'outline'}
                            onClick={() => handleUpdate('overseasCheckStatus', 'failed')}
                        >
                            Fail
                        </Button>
                    </div>
                    {deployment.overseasCheckStatus === 'passed' && (
                        <DatePicker
                            date={deployment.overseasCheckDate ? new Date(deployment.overseasCheckDate) : undefined}
                            onSelect={(date) => handleUpdate('overseasCheckDate', date)}
                            placeholder="Exam Date"
                        />
                    )}
                </div>
            )
        },
        {
            id: 'doc_verification',
            title: 'Doc Verification',
            icon: <FileText className="w-5 h-5" />,
            status: deployment.docVerificationStatus, // pending, submitted, verified
            date: deployment.docVerifiedDate,
            action: (
                <div className="flex flex-col gap-2 mt-2">
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={deployment.docVerificationStatus || 'pending'}
                        onChange={(e) => handleUpdate('docVerificationStatus', e.target.value)}
                    >
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="verified">Verified</option>
                    </select>
                    {deployment.docVerificationStatus === 'submitted' && (
                        <DatePicker
                            date={deployment.docSubmissionDate ? new Date(deployment.docSubmissionDate) : undefined}
                            onSelect={(date) => handleUpdate('docSubmissionDate', date)}
                            placeholder="Sub. Date"
                        />
                    )}
                    {deployment.docVerificationStatus === 'verified' && (
                        <DatePicker
                            date={deployment.docVerifiedDate ? new Date(deployment.docVerifiedDate) : undefined}
                            onSelect={(date) => handleUpdate('docVerifiedDate', date)}
                            placeholder="Ver. Date"
                        />
                    )}
                </div>
            )
        },
        {
            id: 'visa',
            title: 'Visa Application',
            icon: <FileText className="w-5 h-5" />,
            status: deployment.visaStatus, // pending, applied, issued
            date: deployment.visaApplicationDate,
            action: (
                <div className="flex flex-col gap-2 mt-2">
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={deployment.visaStatus || 'pending'}
                        onChange={(e) => handleUpdate('visaStatus', e.target.value)}
                    >
                        <option value="pending">Pending</option>
                        <option value="applied">Applied</option>
                        <option value="issued">Issued</option>
                    </select>
                    {deployment.visaStatus === 'applied' && (
                        <DatePicker
                            date={deployment.visaApplicationDate ? new Date(deployment.visaApplicationDate) : undefined}
                            onSelect={(date) => handleUpdate('visaApplicationDate', date)}
                            placeholder="App. Date"
                        />
                    )}
                    {deployment.visaStatus === 'issued' && (
                        <>
                            <Input
                                placeholder="Visa No."
                                value={deployment.visaNumber || ''}
                                onChange={(e) => handleUpdate('visaNumber', e.target.value)}
                            />
                        </>
                    )}
                </div>
            )
        },
        {
            id: 'flight',
            title: 'Flight Booking',
            icon: <Plane className="w-5 h-5" />,
            status: deployment.flightNumber ? 'booked' : 'pending',
            date: deployment.flightArrivalDate,
            action: (
                <div className="flex flex-col gap-2 mt-2">
                    <Input
                        placeholder="Flight No."
                        value={deployment.flightNumber || ''}
                        onChange={(e) => handleUpdate('flightNumber', e.target.value)}
                    />
                    <DatePicker
                        date={deployment.flightArrivalDate ? new Date(deployment.flightArrivalDate) : undefined}
                        onSelect={(date) => handleUpdate('flightArrivalDate', date)}
                        placeholder="Arrival Date"
                    />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Pre-entry Workflow</h3>
            <div className="relative">
                {/* Connector Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-8 relative">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex gap-4 items-start">
                            <div className={cn(
                                "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2",
                                getStepColor(step.status)
                            )}>
                                {step.icon}
                            </div>
                            <div className="flex-1 space-y-1 pt-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">{step.title}</h4>
                                    {step.date && (
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(step.date), 'yyyy-MM-dd')}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm bg-gray-50/50 p-3 rounded-md border border-gray-100">
                                    {step.action}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function getStepColor(status: string) {
    switch (status) {
        case 'passed':
        case 'verified':
        case 'issued':
        case 'booked':
            return "bg-green-100 border-green-600 text-green-600";
        case 'failed':
            return "bg-red-100 border-red-600 text-red-600";
        case 'submitted':
        case 'applied':
            return "bg-blue-100 border-blue-600 text-blue-600";
        default:
            return "bg-white border-gray-300 text-gray-400";
    }
}

function DatePicker({ date, onSelect, placeholder }: { date?: Date, onSelect: (date: Date | undefined) => void, placeholder: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !date && "text-muted-foreground"
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
