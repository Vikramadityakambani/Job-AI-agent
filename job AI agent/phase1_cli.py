import sys
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

# Ensure we have rich console imports
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt
    from rich.status import Status
except ImportError:
    print("Error: The 'rich' library is required to run this CLI dashboard.")
    print("Please run: pip install rich")
    sys.exit(1)

# Ensure UTF-8 output encoding for Windows CMD/PowerShell terminals
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

console = Console()

# Phase 1 Deliverable: Standardized Job Model
@dataclass
class JobListing:
    source: str      # Naukri, RemoteOK, Wellfound
    title: str       # Job position title
    company: str     # Hiring company name
    location: str    # Job location (e.g. Remote, city, country)
    salary: str      # Salary range / package (or "Not Specified")
    url: str         # Application or posting link

def display_dashboard_header():
    """
    Renders a premium visual header using rich Panels.
    """
    console.print(Panel.fit(
        "[bold cyan]🔍 JOB AGENT CLI - PHASE 1 FOUNDATION[/bold cyan]\n"
        "[dim]Standardized Shell Interface & Console Layout[/dim]",
        border_style="cyan"
    ))

def main():
    display_dashboard_header()
    
    # Prompt the user for job query input
    keyword = Prompt.ask("[bold green]Enter job title or keyword to search[/bold green]")
    if not keyword.strip():
        console.print("[red]Keyword cannot be empty. Exiting.[/red]")
        return
        
    console.print(f"\n[cyan]Initializing Phase 1 shell search for: '{keyword}'[/cyan]\n")
    
    # Phase 1 Deliverable: Render loader status spinners using rich
    with Status("[bold white]Simulating target scrapers initialization...[/bold white]", spinner="dots") as status:
        import time
        time.sleep(1.0)
        status.update("[bold green]✓ Scraper shells initialized successfully![/bold green]")
        
    # Phase 1 Deliverable: Standardized sample listings using our JobListing model
    sample_jobs = [
        JobListing(
            source="RemoteOK",
            title=f"Senior {keyword} Developer",
            company="Global Remote Tech",
            location="Remote",
            salary="$120,000 - $150,000",
            url="https://remoteok.com"
        ),
        JobListing(
            source="Naukri",
            title=f"{keyword} Engineer",
            company="Infosys Limited",
            location="Bangalore/Bengaluru",
            salary="₹ 8,000,000 - 1,200,000 P.A.",
            url="https://naukri.com"
        ),
        JobListing(
            source="Wellfound",
            title=f"Lead {keyword} Architect",
            company="StartupX",
            location="San Francisco, CA",
            salary="$140,000 - $180,000 + 0.5% equity",
            url="https://wellfound.com"
        )
    ]
    
    # Phase 1 Deliverable: Beautiful rich tabular view of standard jobs
    table = Table(
        title=f"Sample Schema Aggregation for '{keyword}'", 
        show_header=True, 
        header_style="bold magenta"
    )
    table.add_column("Source", style="cyan", width=12)
    table.add_column("Job Title", style="bold white")
    table.add_column("Company", style="green")
    table.add_column("Location", style="yellow")
    table.add_column("Salary Range", style="blue")
    
    for job in sample_jobs:
        table.add_row(
            job.source,
            job.title,
            job.company,
            job.location,
            job.salary
        )
        
    console.print(table)
    console.print("\n[bold green]✓ Phase 1 environment and layout validation complete![/bold green]")

if __name__ == "__main__":
    main()
