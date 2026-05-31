import sys
import os
import csv
from typing import List, Dict, Any
from dataclasses import dataclass

from curl_cffi import requests
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

@dataclass
class JobListing:
    source: str
    title: str
    company: str
    location: str
    salary: str
    url: str

def fetch_remoteok_jobs(keyword: str) -> List[JobListing]:
    """
    Query the RemoteOK public API using stealth Chrome headers.
    Bypasses standard client blocks and applies a smart multi-word search filter.
    """
    url = "https://remoteok.com/api"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, impersonate="chrome120", timeout=15)
        if response.status_code != 200:
            console.log(f"[yellow]RemoteOK API returned status code {response.status_code}[/yellow]")
            return []
            
        data = response.json()
        raw_jobs = data[1:] if len(data) > 1 else []
        
        filtered_jobs = []
        keyword_lower = keyword.lower()
        search_terms = [t for t in keyword_lower.split() if t]
        
        for job in raw_jobs:
            position = (job.get("position", "") or "").lower()
            tags = [t.lower() for t in (job.get("tags", []) or [])]
            description = (job.get("description", "") or "").lower()
            
            # Smart Multi-Word Filter: check if all query terms appear anywhere in title, tags, or description
            combined_text = position + " " + " ".join(tags) + " " + description
            match_found = all(term in combined_text for term in search_terms)
            
            if match_found:
                sal_min = job.get("salary_min", 0)
                sal_max = job.get("salary_max", 0)
                salary_str = f"${sal_min:,} - ${sal_max:,}" if (sal_min or sal_max) else "Not Specified"
                
                filtered_jobs.append(JobListing(
                    source="RemoteOK",
                    title=job.get("position", "Developer"),
                    company=job.get("company", "Unknown"),
                    location=job.get("location", "Remote"),
                    salary=salary_str,
                    url=job.get("url", "https://remoteok.com")
                ))
        return filtered_jobs
    except Exception as e:
        console.log(f"[red]Error fetching from RemoteOK: {e}[/red]")
        return []

def save_to_csv(jobs: List[JobListing], filename: str = "jobs_export.csv") -> str:
    """
    CSV export engine to write normalized datasets.
    """
    fields = ["Source", "Job Title", "Company", "Location", "Salary Range", "Apply URL"]
    filepath = os.path.join(os.getcwd(), filename)
    
    try:
        with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(fields)
            for j in jobs:
                writer.writerow([j.source, j.title, j.company, j.location, j.salary, j.url])
        return filepath
    except Exception as e:
        console.print(f"[red]Error exporting CSV: {e}[/red]")
        return ""

def main():
    console.print(Panel.fit(
        "[bold cyan]🔍 JOB AGENT CLI - PHASE 2 (PUBLIC API & CSV ENGINE)[/bold cyan]\n"
        "[dim]Live RemoteOK Scraper & Normalized CSV Exporter[/dim]",
        border_style="cyan"
    ))
    
    keyword = Prompt.ask("[bold green]Enter job title or keyword to search (e.g. Sales, Support)[/bold green]")
    if not keyword.strip():
        console.print("[red]Keyword cannot be empty. Exiting.[/red]")
        return
        
    aggregated_jobs: List[JobListing] = []
    
    # Fetch live RemoteOK listings
    with Status(f"[bold white]Fetching live RemoteOK listings for '{keyword}'...[/bold white]", console=console, spinner="dots") as status:
        remoteok_jobs = fetch_remoteok_jobs(keyword)
        aggregated_jobs.extend(remoteok_jobs)
        status.update("[bold green]✓ RemoteOK live fetch completed![/bold green]")
    console.print(f"  [cyan]-> Found {len(remoteok_jobs)} matches on RemoteOK[/cyan]\n")
    
    # Stand-in shell messages for Naukri and Wellfound (Phase 3 & 4)
    console.print("[dim]Naukri HTML Scraper (Scheduled for Phase 3)[/dim]")
    console.print("[dim]Wellfound Firecrawl Scraper (Scheduled for Phase 4)[/dim]\n")
    
    if not aggregated_jobs:
        console.print("[bold yellow]No jobs found matching your keyword.[/bold yellow]")
        return
        
    # Export results to CSV
    with Status("[bold white]Generating jobs_export.csv...[/bold white]", console=console, spinner="dots"):
        filepath = save_to_csv(aggregated_jobs, "jobs_export.csv")
        
    if filepath:
        console.print(Panel(
            f"[bold green]✓ Success![/bold green] Exported [bold yellow]{len(aggregated_jobs)}[/bold yellow] jobs to CSV:\n"
            f"[link=file:///{filepath}]{filepath}[/link]",
            title="Export Status",
            border_style="green"
        ))
        
    # Display results table
    table = Table(title=f"RemoteOK Results for '{keyword}'", show_header=True, header_style="bold magenta")
    table.add_column("Source", style="cyan", width=10)
    table.add_column("Job Title", style="bold white")
    table.add_column("Company", style="green")
    table.add_column("Location", style="yellow")
    table.add_column("Salary Range", style="blue")
    
    for j in aggregated_jobs[:15]:
        table.add_row(j.source, j.title, j.company, j.location, j.salary)
        
    console.print(table)
    if len(aggregated_jobs) > 15:
        console.print(f"[dim]And {len(aggregated_jobs) - 15} more jobs saved to CSV...[/dim]")

if __name__ == "__main__":
    main()
