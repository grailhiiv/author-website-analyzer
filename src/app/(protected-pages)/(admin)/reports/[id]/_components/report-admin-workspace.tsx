"use client";

import { TbDeviceFloppy, TbSparkles } from "react-icons/tb";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
import Tag from "@/components/ui/Tag";

import {
  generateOutreachMessageAction,
  updateSalesNotesAction,
} from "../actions";

type SelectOption = {
  label: string;
  value: string;
};

type OutreachDraft = {
  emailVersion: string;
  shortDmVersion: string;
  followUpVersion: string;
};

type ReportAdminWorkspaceProps = {
  reportId: string;
  lead: {
    fullName: string;
    email: string;
    consent: string;
    captured: string;
  } | null;
  leadStatus: string;
  leadStatusOptions: SelectOption[];
  serviceFit: string;
  serviceFitOptions: SelectOption[];
  priority: string;
  priorityOptions: SelectOption[];
  manualNote: string;
  outreachAngle: string;
  outreach: {
    sourceLabel: string;
    generatedAt: string;
    message: OutreachDraft;
  } | null;
};

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  return (
    <label className="mb-2 block font-semibold text-gray-700" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="break-words font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function DraftBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200">
        {value}
      </div>
    </div>
  );
}

export default function ReportAdminWorkspace({
  reportId,
  lead,
  leadStatus,
  leadStatusOptions,
  serviceFit,
  serviceFitOptions,
  priority,
  priorityOptions,
  manualNote,
  outreachAngle,
  outreach,
}: ReportAdminWorkspaceProps) {
  return (
    <Tabs defaultValue="lead" variant="pill">
      <Tabs.TabList className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
        <Tabs.TabNav value="lead">Lead</Tabs.TabNav>
        <Tabs.TabNav value="sales">Sales</Tabs.TabNav>
        <Tabs.TabNav value="outreach">Outreach</Tabs.TabNav>
      </Tabs.TabList>

      <Tabs.TabContent value="lead">
        {lead ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Detail label="Full name" value={lead.fullName} />
            <Detail label="Email" value={lead.email} />
            <Detail label="Consent" value={lead.consent} />
            <Detail label="Captured" value={lead.captured} />
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-700/40">
            No lead has unlocked this report yet.
          </div>
        )}
      </Tabs.TabContent>

      <Tabs.TabContent value="sales">
        <form action={updateSalesNotesAction} className="space-y-5">
          <input type="hidden" name="reportId" value={reportId} />

          <div>
            <FieldLabel htmlFor="leadStatus">Lead status</FieldLabel>
            <Select<SelectOption>
              inputId="leadStatus"
              name="leadStatus"
              options={leadStatusOptions}
              defaultValue={leadStatusOptions.find(
                (option) => option.value === leadStatus,
              )}
            />
          </div>

          <div>
            <FieldLabel htmlFor="serviceFit">Service fit</FieldLabel>
            <Select<SelectOption>
              inputId="serviceFit"
              name="serviceFit"
              options={serviceFitOptions}
              defaultValue={serviceFitOptions.find(
                (option) => option.value === serviceFit,
              )}
            />
          </div>

          <div>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <Select<SelectOption>
              inputId="priority"
              name="priority"
              options={priorityOptions}
              defaultValue={priorityOptions.find(
                (option) => option.value === priority,
              )}
            />
          </div>

          <div>
            <FieldLabel htmlFor="manualNote">Manual note</FieldLabel>
            <Input
              id="manualNote"
              name="manualNote"
              textArea
              rows={6}
              defaultValue={manualNote}
              placeholder="Add internal context, follow-up notes, or outreach details."
            />
          </div>

          <Button block type="submit" variant="solid" icon={<TbDeviceFloppy />}>
            Save sales notes
          </Button>
        </form>
      </Tabs.TabContent>

      <Tabs.TabContent value="outreach">
        <div className="space-y-5">
          <div className="rounded-xl bg-primary-subtle p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Suggested angle
            </div>
            <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">
              {outreachAngle}
            </p>
          </div>

          <form action={generateOutreachMessageAction}>
            <input type="hidden" name="reportId" value={reportId} />
            <Button block type="submit" variant="solid" icon={<TbSparkles />}>
              Generate outreach message
            </Button>
          </form>

          {outreach ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="border-0 bg-primary-subtle text-primary">
                  {outreach.sourceLabel}
                </Tag>
                <span className="text-xs text-gray-500">
                  Generated {outreach.generatedAt}
                </span>
              </div>
              <DraftBlock
                label="Email version"
                value={outreach.message.emailVersion}
              />
              <DraftBlock
                label="Short DM version"
                value={outreach.message.shortDmVersion}
              />
              <DraftBlock
                label="Follow-up version"
                value={outreach.message.followUpVersion}
              />
            </div>
          ) : (
            <p className="text-sm leading-6 text-gray-500">
              Generate a low-pressure draft based on the strongest saved report
              findings.
            </p>
          )}
        </div>
      </Tabs.TabContent>
    </Tabs>
  );
}
