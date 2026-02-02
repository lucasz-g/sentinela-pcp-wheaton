import { Upload, FileText, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";
import type { PrefixGroup } from "@/pages/Home";

interface FileUploadProps {
  onFileProcessed: (data: PrefixGroup[]) => void;
  onFileSelected: () => void;
  isLoading: boolean;
}

export function FileUpload({ onFileProcessed, onFileSelected, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls')
    );

    if (validFile) {
      setSelectedFile(validFile);
    } else {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx)");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    onFileSelected();

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar arquivo');
      }

      const data = await response.json();
      onFileProcessed(data);
      toast.success("Arquivo processado com sucesso!");
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao processar o arquivo CSV");
      onFileProcessed([]);
    }
  };

  return (
    <Card
      className={`p-8 border-2 border-dashed transition-all ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-slate-600" />
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Carregar Relatório de Apontamento
        </h3>
        <p className="text-slate-600 mb-6">
          Arraste e solte o arquivo Excel (.xlsx) aqui ou clique para selecionar
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            asChild
          >
            <span>Selecionar Arquivo Excel</span>
          </Button>
        </label>

        {selectedFile && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-900">
                {selectedFile.name}
              </span>
              <span className="text-sm text-slate-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Processar Arquivo"
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
