const FullPageLoading = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default FullPageLoading;
