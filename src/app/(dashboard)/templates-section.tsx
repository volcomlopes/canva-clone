"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, TriangleAlert, ChevronDown } from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import { ResponseType, useGetTemplates } from "@/features/projects/api/use-get-templates";
import { useDuplicateFromTemplate } from "@/features/projects/api/use-duplicate-from-template";

import { Button } from "@/components/ui/button";

import { TemplateCard } from "./template-card";

const INITIAL_LIMIT = 12;
const LOAD_MORE_STEP = 12;

export const TemplatesSection = () => {
  const { shouldBlock, triggerPaywall } = usePaywall();
  const router = useRouter();
  const duplicateFromTemplate = useDuplicateFromTemplate();

  const [limit, setLimit] = useState(INITIAL_LIMIT);

  const {
    data,
    isLoading,
    isError
  } = useGetTemplates({ page: "1", limit: String(limit) });

  const onClick = (template: ResponseType["data"][0]) => {
    if (template.isPro && shouldBlock) {
      triggerPaywall();
      return;
    }

    duplicateFromTemplate.mutate(template.id, {
      onSuccess: function (response) {
        router.push(`/editor/${response.data.id}`);
      },
    });
  };

  const handleLoadMore = () => {
    setLimit(function (current) {
      return current + LOAD_MORE_STEP;
    });
  };

  // Quando data retorna menos que o limite, significa que nao tem mais templates
  const hasMore = data && data.length === limit;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Comece com um template
        </h3>
        <div className="flex items-center justify-center h-32">
          <Loader className="size-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Comece com um template
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <TriangleAlert className="size-6 text-muted-foreground" />
          <p>
            Erro ao carregar templates
          </p>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold text-lg">
        Comece com um template
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 mt-4 gap-4">
        {data?.map((template) => (
          <TemplateCard
            key={template.id}
            title={template.name}
            imageSrc={template.thumbnailUrl || ""}
            onClick={() => onClick(template)}
            disabled={duplicateFromTemplate.isPending}
            description={`${template.width} x ${template.height} px`}
            width={template.width}
            height={template.height}
            isPro={template.isPro}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={duplicateFromTemplate.isPending}
          >
            <ChevronDown className="size-4 mr-2" />
            Ver mais templates
          </Button>
        </div>
      )}
    </div>
  );
};